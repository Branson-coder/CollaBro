import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useTaskStore } from '../store/taskStore'

const SOCKET_URL = 'http://localhost:4000'

let socketInstance = null

export function useSocket(teamId) {
  const { applyRemoteCreate, applyRemoteUpdate, applyRemoteDelete } = useTaskStore()
  const currentTeamRef = useRef(null)

  useEffect(() => {
    // Create socket once
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
      })
    }

    const socket = socketInstance

    const onConnect = () => {
      console.log('Socket connected:', socket.id)
      // Rejoin team room on every (re)connect
      if (teamId) {
        socket.emit('join_team', teamId)
        currentTeamRef.current = teamId
      }
    }

    socket.on('connect', onConnect)
    socket.on('task_created', applyRemoteCreate)
    socket.on('task_updated', applyRemoteUpdate)
    socket.on('task_deleted', applyRemoteDelete)

    // If already connected and teamId just changed, join immediately
    if (socket.connected && teamId && teamId !== currentTeamRef.current) {
      if (currentTeamRef.current) {
        socket.emit('leave_team', currentTeamRef.current)
      }
      socket.emit('join_team', teamId)
      currentTeamRef.current = teamId
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('task_created', applyRemoteCreate)
      socket.off('task_updated', applyRemoteUpdate)
      socket.off('task_deleted', applyRemoteDelete)
    }
  }, [teamId])
}