import pool from '../db.js'

// Usage: router.delete('/:id', auth, checkRole('owner', 'admin'), handler)
export function checkRole(...allowedRoles) {
  return async (req, res, next) => {
    const teamId = req.params.teamId || req.body.team_id || req.query.teamId
    if (!teamId) return next()

    try {
      const result = await pool.query(
        `SELECT role FROM team_members
         WHERE team_id = $1 AND user_id = $2`,
        [teamId, req.userId]
      )

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Not a member of this team' })
      }

      const userRole = result.rows[0].role
      req.userRole = userRole

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Requires role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
        })
      }

      next()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Server error' })
    }
  }
}

// Attach user's role to req without blocking — useful for conditional logic
export async function attachRole(req, res, next) {
  const teamId = req.params.teamId || req.body.team_id || req.query.teamId
  if (!teamId || !req.userId) return next()

  try {
    const result = await pool.query(
      `SELECT role FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, req.userId]
    )
    req.userRole = result.rows[0]?.role || null
  } catch {
    req.userRole = null
  }
  next()
}