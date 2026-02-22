import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useTaskStore } from '../store/taskStore'

const SOCKET_URL = 'http://localhost:4000'

export function useSocket(teamId) {
  const socketRef = useRef(null)
  const { applyRemoteCreate, applyRemoteUpdate, applyRemoteDelete } = useTaskStore()

  useEffect(() => {
    if (!teamId) return

    const socket = io(SOCKET_URL)
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      socket.emit('join_team', teamId)
    })

    socket.on('task_created', (task) => {
      applyRemoteCreate(task)
    })

    socket.on('task_updated', (task) => {
      applyRemoteUpdate(task)
    })

    socket.on('task_deleted', (taskId) => {
      applyRemoteDelete(taskId)
    })

    return () => {
      socket.emit('leave_team', teamId)
      socket.disconnect()
    }
  }, [teamId])

  return socketRef.current
}