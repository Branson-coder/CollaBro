import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

// Register
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, username, and password are required' })
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.status(400).json({
      error: 'Username must be 3-30 characters, letters, numbers, and underscores only'
    })
  }

  try {
    const emailCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [email])
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const usernameCheck = await pool.query(`SELECT id FROM users WHERE username = $1`, [username])
    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username)
       VALUES ($1, $2, $3) RETURNING id, email, username`,
      [email, hash, username]
    )
    const user = result.rows[0]
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id, email: user.email, username: user.username } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Login — accepts email or username
router.post('/login', async (req, res) => {
  const { login, password } = req.body
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password are required' })
  }

  try {
    // Try matching email first, then username
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $1`,
      [login]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router