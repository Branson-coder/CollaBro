import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.js'
import tasksRoutes from './routes/tasks.js'
import teamsRouter from './routes/teams.js'

const app = express()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
})

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send('Backend running'))
app.use('/auth', authRoutes)
app.use('/tasks', tasksRoutes)
app.use('/teams', teamsRouter)

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Join a team room to receive team-specific events
  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`)
    console.log(`Socket ${socket.id} joined team_${teamId}`)
  })

  socket.on('leave_team', (teamId) => {
    socket.leave(`team_${teamId}`)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))