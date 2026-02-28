import pool from '../db.js'

export async function logActivity({ teamId, taskId, userId, action, details }) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (team_id, task_id, user_id, action, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [teamId || null, taskId || null, userId || null, action, details || null]
    )
  } catch (err) {
    // Never let logging break the main request
    console.error('Activity log error:', err.message)
  }
}