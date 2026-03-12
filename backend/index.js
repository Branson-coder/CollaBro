import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.js'
import tasksRoutes from './routes/tasks.js'
import teamsRouter from './routes/teams.js'
import activityRoutes from './routes/activity.js'
import { startCleanupJob } from './utils/cleanup.js'
import attachmentRoutes from './routes/attachments.js'
import { fileURLToPath } from 'url'
import path from 'path'



const app = express()
const httpServer = createServer(app)
const __dirname = path.dirname(fileURLToPath(import.meta.url))


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
app.use('/activity', activityRoutes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/attachments', attachmentRoutes)

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

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
startCleanupJob()