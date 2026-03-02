import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useTaskStore } from '../store/taskStore'

const SOCKET_URL = 'http://localhost:4000'

// Single shared socket instance across all hook calls
let sharedSocket = null

export function useSocket(teamId) {
  const prevTeamRef = useRef(null)
  // Always read fresh from store — avoids stale closure bug
  const applyRemoteCreate = useTaskStore((s) => s.applyRemoteCreate)
  const applyRemoteUpdate = useTaskStore((s) => s.applyRemoteUpdate)
  const applyRemoteDelete = useTaskStore((s) => s.applyRemoteDelete)

  // Stable refs so event listeners never go stale
  const createRef = useRef(applyRemoteCreate)
  const updateRef = useRef(applyRemoteUpdate)
  const deleteRef = useRef(applyRemoteDelete)
  useEffect(() => { createRef.current = applyRemoteCreate }, [applyRemoteCreate])
  useEffect(() => { updateRef.current = applyRemoteUpdate }, [applyRemoteUpdate])
  useEffect(() => { deleteRef.current = applyRemoteDelete }, [applyRemoteDelete])

  useEffect(() => {
    // Create socket once
    if (!sharedSocket) {
      sharedSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
      })
    }

    const socket = sharedSocket

    const handleCreate = (task) => createRef.current(task)
    const handleUpdate = (task) => updateRef.current(task)
    const handleDelete = (id)   => deleteRef.current(id)

    const joinTeam = () => {
      if (teamId) {
        console.log('Joining team room:', teamId)
        socket.emit('join_team', teamId)
        prevTeamRef.current = teamId
      }
    }

    // Register event listeners
    socket.on('task_created', handleCreate)
    socket.on('task_updated', handleUpdate)
    socket.on('task_deleted', handleDelete)

    // Join on connect (handles initial connect AND reconnects)
    socket.on('connect', joinTeam)

    // If already connected when this effect runs, join immediately
    // This is the key fix: don't wait for a 'connect' event that already fired
    if (socket.connected) {
      joinTeam()
    }

    return () => {
      socket.off('task_created', handleCreate)
      socket.off('task_updated', handleUpdate)
      socket.off('task_deleted', handleDelete)
      socket.off('connect', joinTeam)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle teamId changing (switching teams)
  useEffect(() => {
    if (!sharedSocket) return

    const prev = prevTeamRef.current

    if (prev && prev !== teamId) {
      console.log('Leaving team room:', prev)
      sharedSocket.emit('leave_team', prev)
    }

    if (teamId && teamId !== prev) {
      if (sharedSocket.connected) {
        console.log('Joining team room:', teamId)
        sharedSocket.emit('join_team', teamId)
      }
      // If not connected yet, the 'connect' handler above will fire join when ready
      prevTeamRef.current = teamId
    }
  }, [teamId])
}