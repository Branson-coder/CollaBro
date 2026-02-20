import express from 'express'
import db from '../db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Create a team
router.post('/', auth, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Team name required' })

  try {
    const team = await db.query(
      `INSERT INTO teams (name, owner_id) VALUES ($1, $2) RETURNING *`,
      [name, req.userId]
    )
    // Add creator as admin member automatically
    await db.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [team.rows[0].id, req.userId]
    )
    res.status(201).json(team.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all teams for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, tm.role
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get a single team with its members
router.get('/:id', auth, async (req, res) => {
  try {
    // Verify requester is a member
    const membership = await db.query(
      `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    )
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' })
    }

    const members = await db.query(
      `SELECT u.id, u.email, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1`,
      [req.params.id]
    )
    res.json(members.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Invite a user to a team by email
router.post('/:id/invite', auth, async (req, res) => {
  const { email } = req.body
  try {
    // Only admins can invite
    const membership = await db.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    )
    if (!membership.rows[0] || membership.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can invite members' })
    }

    // Find user by email
    const user = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    )
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email' })
    }

    // Add them
    await db.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT DO NOTHING`,
      [req.params.id, user.rows[0].id]
    )
    res.json({ message: 'Member added successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router