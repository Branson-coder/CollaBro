import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../uploads')

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
})

const router = express.Router()

// Upload attachment to a task
router.post('/:taskId', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    // Verify user has access to the task
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`, [req.params.taskId]
    )
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const result = await pool.query(
      `INSERT INTO attachments (task_id, user_id, filename, originalname, mimetype, size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.params.taskId,
        req.userId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all attachments for a task
router.get('/:taskId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.email as uploader_email
       FROM attachments a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.taskId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Download/view a file
router.get('/file/:filename', auth, async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  res.sendFile(filePath)
})

// Delete an attachment
router.delete('/:attachmentId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM attachments WHERE id = $1`, [req.params.attachmentId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' })
    }
    const attachment = result.rows[0]

    // Only uploader or admin can delete
    if (attachment.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, attachment.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await pool.query(`DELETE FROM attachments WHERE id = $1`, [req.params.attachmentId])
    res.json({ message: 'Attachment deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router