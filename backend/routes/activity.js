import express from 'express'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

router.get('/:teamId', auth, async (req, res) => {
  try {
    // Verify requester is a team member
    const member = await pool.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.userId]
    )
    if (member.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' })
    }

    const result = await pool.query(
      `SELECT al.*, u.username, u.email as user_email, t.title as task_title
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN tasks t ON t.id = al.task_id
      WHERE al.team_id = $1
      ORDER BY al.created_at DESC
      LIMIT 50`,
      [req.params.teamId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router