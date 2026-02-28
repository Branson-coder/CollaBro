import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useTaskStore } from '../store/taskStore'

const SOCKET_URL = 'http://localhost:4000'

export function useSocket(teamId) {
  const { applyRemoteCreate, applyRemoteUpdate, applyRemoteDelete } = useTaskStore()
  const socketRef    = useRef(null)
  const prevTeamRef  = useRef(null)

  useEffect(() => {
    // Create a new socket per component mount — no shared singleton
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      if (teamId) {
        socket.emit('join_team', teamId)
        prevTeamRef.current = teamId
      }
    })

    socket.on('task_created', applyRemoteCreate)
    socket.on('task_updated', applyRemoteUpdate)
    socket.on('task_deleted', applyRemoteDelete)

    return () => {
      if (prevTeamRef.current) {
        socket.emit('leave_team', prevTeamRef.current)
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // Handle teamId changes after mount
  useEffect(() => {
    const socket = socketRef.current
    if (!socket?.connected) return
    if (prevTeamRef.current && prevTeamRef.current !== teamId) {
      socket.emit('leave_team', prevTeamRef.current)
    }
    if (teamId) {
      socket.emit('join_team', teamId)
      prevTeamRef.current = teamId
    }
  }, [teamId])
}