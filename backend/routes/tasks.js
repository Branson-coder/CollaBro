import express from 'express'
import pool from '../db.js'
import auth from '../middleware/auth.js'
import { checkRole } from '../middleware/checkRole.js'
import { io } from '../index.js'
import { logActivity } from '../utils/logActivity.js'

const router = express.Router()

// GET /tasks — viewers and above can read
router.get('/', auth, async (req, res) => {
  const { teamId } = req.query
  try {
    let result
    if (teamId) {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [teamId, req.userId]
      )
      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Not a member of this team' })
      }
      result = await pool.query(
        `SELECT tasks.*, users.email as assignee_email
         FROM tasks
         LEFT JOIN users ON users.id = tasks.user_id
         WHERE tasks.team_id = $1
         ORDER BY tasks.position ASC, tasks.created_at DESC`,
        [teamId]
      )
    } else {
      result = await pool.query(
        `SELECT * FROM tasks WHERE user_id = $1
         ORDER BY position ASC, created_at DESC`,
        [req.userId]
      )
    }
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /tasks — members, admins, owners only (not viewers)
router.post('/', auth, async (req, res) => {
  const { title, description, status, priority, due_date, team_id, position } = req.body
  try {
    // Check role if team task
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
        title,
        description || null,
        status || 'todo',
        priority || 'medium',
        due_date || null,
        team_id || null,
        req.userId,
        position || 0,
      ]
    )
    const task = result.rows[0]
     await logActivity({
      teamId: task.team_id,
      taskId: task.id,
      userId: req.userId,
      action: 'created',
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

router.put('/:id', auth, async (req, res) => {
  const { title, description, status, priority, due_date, position, team_id } = req.body
  try {
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`, [req.params.id]
    )
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const task = taskResult.rows[0]

    // Use team_id from task record, not from body
    const effectiveTeamId = task.team_id

    if (effectiveTeamId) {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [effectiveTeamId, req.userId]
      )
      const role = member.rows[0]?.role
      if (!role) return res.status(403).json({ error: 'Not a member of this team' })
      if (role === 'viewer') return res.status(403).json({ error: 'Viewers cannot edit tasks' })
      if (role === 'member' && task.user_id !== req.userId && status) {
        // Members CAN move any task between columns (status change)
        // cannot edit task details of others
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

const updatedTask = result.rows[0]


// Fetch with email join so assignee_email is included
const withEmail = await pool.query(
  `SELECT tasks.*, users.email as assignee_email
   FROM tasks
   LEFT JOIN users ON users.id = tasks.user_id
   WHERE tasks.id = $1`,
  [updatedTask.id]
)
const updated = withEmail.rows[0]
  
await logActivity({
    teamId: updated.team_id,
    taskId: updated.id,
    userId: req.userId,
    action: 'updated',
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

// DELETE /tasks/:id — owners/admins can delete any, members only their own
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
      teamId: task.team_id,
      taskId: task.id,
      userId: req.userId,
      action: 'deleted',
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

export default router