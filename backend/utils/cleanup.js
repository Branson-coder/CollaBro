import pool from '../db.js'

const RETENTION_DAYS = 30

export function startCleanupJob() {
  const run = async () => {
    try {
      const result = await pool.query(
        `DELETE FROM activity_logs
         WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`
      )
      if (result.rowCount > 0) {
        console.log(`Cleanup: deleted ${result.rowCount} old activity logs`)
      }
    } catch (err) {
      console.error('Cleanup job error:', err.message)
    }
  }

  // Run once immediately on startup
  run()

  // Then run every 24 hours
  setInterval(run, 24 * 60 * 60 * 1000)

  console.log(`Activity log cleanup job started — retaining ${RETENTION_DAYS} days`)
}