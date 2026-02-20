import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body
  const hashed = await bcrypt.hash(password, 10)
  try {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashed]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
  const user = result.rows[0]
  if (!user) return res.status(400).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' })
  res.json({ user: { id: user.id, email: user.email }, token })
})

export default router