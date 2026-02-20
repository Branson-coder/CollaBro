import express from 'express'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// GET /tasks
router.get('/', auth, async (req, res) => {
  const { teamId } = req.query
  try {
    let result
    if (teamId) {
      const member = await pool.query(
        `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
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

// POST /tasks
router.post('/', auth, async (req, res) => {
  const { title, description, status, priority, due_date, team_id, position } = req.body
  try {
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
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /tasks/:id
router.put('/:id', auth, async (req, res) => {
  const { title, description, status, priority, due_date, position } = req.body
  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           status      = COALESCE($3, status),
           priority    = COALESCE($4, priority),
           due_date    = COALESCE($5, due_date),
           position    = COALESCE($6, position),
           updated_at  = NOW()
       WHERE id = $7 AND (user_id = $8 OR team_id IN (
         SELECT team_id FROM team_members WHERE user_id = $8
       ))
       RETURNING *`,
      [title, description, status, priority, due_date, position, req.params.id, req.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or not authorized' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or not authorized' })
    }
    res.json({ message: 'Task deleted', id: result.rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router