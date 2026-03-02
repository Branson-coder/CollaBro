import express from 'express'
import pool from '../db.js'
import auth from '../middleware/auth.js'
import { io } from '../index.js'
import { logActivity } from '../utils/logActivity.js'

const router = express.Router()

// Helper — fetch a task with assignee_email and assignees array
async function getTaskWithAssignees(taskId) {
  const result = await pool.query(
    `SELECT tasks.*, users.email as assignee_email
     FROM tasks
     LEFT JOIN users ON users.id = tasks.user_id
     WHERE tasks.id = $1`,
    [taskId]
  )
  if (result.rows.length === 0) return null
  const task = result.rows[0]

  const assignees = await pool.query(
    `SELECT u.id, u.email
     FROM task_assignments ta
     JOIN users u ON u.id = ta.user_id
     WHERE ta.task_id = $1
     ORDER BY ta.assigned_at ASC`,
    [taskId]
  )
  task.assignees = assignees.rows
  return task
}

// GET /tasks
router.get('/', auth, async (req, res) => {
  const { teamId } = req.query
  try {
    let taskRows
    if (teamId) {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [teamId, req.userId]
      )
      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Not a member of this team' })
      }
      const result = await pool.query(
        `SELECT tasks.*, users.email as assignee_email
         FROM tasks
         LEFT JOIN users ON users.id = tasks.user_id
         WHERE tasks.team_id = $1
         ORDER BY tasks.position ASC, tasks.created_at DESC`,
        [teamId]
      )
      taskRows = result.rows
    } else {
      const result = await pool.query(
        `SELECT * FROM tasks WHERE user_id = $1
         ORDER BY position ASC, created_at DESC`,
        [req.userId]
      )
      taskRows = result.rows
    }

    // Attach assignees to each task
    const taskIds = taskRows.map((t) => t.id)
    let assigneeMap = {}
    if (taskIds.length > 0) {
      const assignees = await pool.query(
        `SELECT ta.task_id, u.id, u.email
         FROM task_assignments ta
         JOIN users u ON u.id = ta.user_id
         WHERE ta.task_id = ANY($1)
         ORDER BY ta.assigned_at ASC`,
        [taskIds]
      )
      assignees.rows.forEach((row) => {
        if (!assigneeMap[row.task_id]) assigneeMap[row.task_id] = []
        assigneeMap[row.task_id].push({ id: row.id, email: row.email })
      })
    }

    const tasks = taskRows.map((t) => ({ ...t, assignees: assigneeMap[t.id] || [] }))
    res.json(tasks)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /tasks
router.post('/', auth, async (req, res) => {
  const { title, description, status, priority, due_date, team_id, position } = req.body
  try {
    if (team_id) {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [team_id, req.userId]
      )
      const role = member.rows[0]?.role
      if (!role) return res.status(403).json({ error: 'Not a member of this team' })
      if (role === 'viewer') return res.status(403).json({ error: 'Viewers cannot create tasks' })
    }

    const result = await pool.query(
      `INSERT INTO tasks
         (title, description, status, priority, due_date, team_id, user_id, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title, description || null, status || 'todo',
        priority || 'medium', due_date || null,
        team_id || null, req.userId, position || 0,
      ]
    )
    const task = { ...result.rows[0], assignees: [] }

    await logActivity({
      teamId: task.team_id, taskId: task.id,
      userId: req.userId, action: 'created',
      details: `Created task "${task.title}"`,
    })

    if (task.team_id) {
      io.to(`team_${task.team_id}`).emit('task_created', task)
    }
    res.status(201).json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /tasks/:id
router.put('/:id', auth, async (req, res) => {
  const { title, description, status, priority, due_date, position } = req.body
  try {
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`, [req.params.id]
    )
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const task = taskResult.rows[0]
    const effectiveTeamId = task.team_id

    if (effectiveTeamId) {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [effectiveTeamId, req.userId]
      )
      const role = member.rows[0]?.role
      if (!role) return res.status(403).json({ error: 'Not a member of this team' })
      if (role === 'viewer') return res.status(403).json({ error: 'Viewers cannot edit tasks' })
      if (role === 'member' && task.user_id !== req.userId) {
        const isStatusOnlyUpdate = status && !title && !description && !priority && !due_date
        if (!isStatusOnlyUpdate) {
          return res.status(403).json({ error: 'Members can only edit their own tasks' })
        }
      }
    }

    const result = await pool.query(
      `UPDATE tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           status      = COALESCE($3, status),
           priority    = COALESCE($4, priority),
           due_date    = COALESCE($5, due_date),
           position    = COALESCE($6, position),
           updated_at  = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, status, priority, due_date, position, req.params.id]
    )

    const updated = await getTaskWithAssignees(result.rows[0].id)

    await logActivity({
      teamId: updated.team_id, taskId: updated.id,
      userId: req.userId, action: 'updated',
      details: status
        ? `Moved "${updated.title}" to ${status}`
        : `Updated task "${updated.title}"`,
    })

    if (updated.team_id) {
      io.to(`team_${updated.team_id}`).emit('task_updated', updated)
    }
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`, [req.params.id]
    )
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const task = taskResult.rows[0]

    await logActivity({
      teamId: task.team_id, taskId: task.id,
      userId: req.userId, action: 'deleted',
      details: `Deleted task "${task.title}"`,
    })

    if (task.team_id) {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [task.team_id, req.userId]
      )
      const role = member.rows[0]?.role
      if (!role) return res.status(403).json({ error: 'Not a member of this team' })
      if (role === 'viewer') return res.status(403).json({ error: 'Viewers cannot delete tasks' })
      if (role === 'member' && task.user_id !== req.userId) {
        return res.status(403).json({ error: 'Members can only delete their own tasks' })
      }
    }

    await pool.query(`DELETE FROM tasks WHERE id = $1`, [req.params.id])
    if (task.team_id) {
      io.to(`team_${task.team_id}`).emit('task_deleted', task.id)
    }
    res.json({ message: 'Task deleted', id: task.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /tasks/:id/assign — toggle assign/unassign self
router.post('/:id/assign', auth, async (req, res) => {
  try {
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`, [req.params.id]
    )
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const task = taskResult.rows[0]

    // Check membership
    if (task.team_id) {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [task.team_id, req.userId]
      )
      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Not a member of this team' })
      }
    }

    // Check if already assigned
    const existing = await pool.query(
      `SELECT 1 FROM task_assignments WHERE task_id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    )

    if (existing.rows.length > 0) {
      // Unassign
      await pool.query(
        `DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2`,
        [req.params.id, req.userId]
      )
    } else {
      // Assign
      await pool.query(
        `INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)`,
        [req.params.id, req.userId]
      )
    }

    const updated = await getTaskWithAssignees(req.params.id)

    if (updated.team_id) {
      io.to(`team_${updated.team_id}`).emit('task_updated', updated)
    }
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router