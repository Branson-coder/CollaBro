import express from 'express'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Create a team — creator becomes owner
router.post('/', auth, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Team name required' })
  try {
    const team = await pool.query(
      `INSERT INTO teams (name, owner_id) VALUES ($1, $2) RETURNING *`,
      [name, req.userId]
    )
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
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
    const result = await pool.query(
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

// Get team members — any member can view
router.get('/:teamId', auth, async (req, res) => {
  try {
    const membership = await pool.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.userId]
    )
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' })
    }
    const members = await pool.query(
      `SELECT u.id, u.email, u.username, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [req.params.teamId]
    )
    res.json(members.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Invite — admins and owners only
router.post('/:teamId/invite', auth, async (req, res) => {
  const { email, role = 'member' } = req.body
  try {
    const membership = await pool.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.userId]
    )
    const userRole = membership.rows[0]?.role
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only owners and admins can invite members' })
    }
    // Prevent inviting someone as owner
    if (role === 'owner') {
      return res.status(400).json({ error: 'Cannot assign owner role via invite' })
    }
    const user = await pool.query(
      `SELECT id, username FROM users WHERE email = $1`, [email]
    )
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email' })
    }
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [req.params.teamId, user.rows[0].id, role]
    )
    res.json({ message: 'Member added successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:teamId/members/:userId/role', auth, async (req, res) => {
  const { role } = req.body
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }
  try {
    console.log('PATCH role — teamId:', req.params.teamId, '| requesterId:', req.userId)
    
    const membership = await pool.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.userId]
    )
    console.log('PATCH role — membership found:', membership.rows)

    if (membership.rows[0]?.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can change roles' })
    }
    if (parseInt(req.params.userId) === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own role' })
    }
    await pool.query(
      `UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3`,
      [role, req.params.teamId, req.params.userId]
    )
    res.json({ message: 'Role updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Remove member — owners and admins only
router.delete('/:teamId/members/:userId', auth, async (req, res) => {
  try {
    const membership = await pool.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.userId]
    )
    const userRole = membership.rows[0]?.role
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only owners and admins can remove members' })
    }
    // Prevent removing the owner
    const targetMembership = await pool.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.params.userId]
    )
    if (targetMembership.rows[0]?.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove the team owner' })
    }
    await pool.query(
      `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.params.userId]
    )
    res.json({ message: 'Member removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router