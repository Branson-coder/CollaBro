import { useEffect, useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import Column from '../components/Column'

const STATUSES = ['todo', 'in_progress', 'review', 'done']

export default function Board() {
  const { tasks, fetchTasks, updateTask, clearTasks } = useTaskStore()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  // For now use personal tasks (no teamId)
  // Once teams UI is built, swap this for the active team's id
  const teamId = null
  useSocket(teamId)

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' })
  const [showForm, setShowForm] = useState(false)
  const { createTask } = useTaskStore()

  useEffect(() => {
    fetchTasks(teamId)
  }, [])

  // Group tasks by status
  const columns = STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {})

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    const taskId = parseInt(draggableId)
    const newStatus = destination.droppableId

    // Optimistic update — move it in the UI immediately
    useTaskStore.setState((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, position: destination.index }
          : t
      ),
    }))

    // Persist to backend
    await updateTask(taskId, { status: newStatus, position: destination.index })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    await createTask({ ...newTask, team_id: teamId })
    setNewTask({ title: '', description: '', priority: 'medium' })
    setShowForm(false)
  }

  const handleLogout = () => {
    clearTasks()
    logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
          FlowTask
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</span>
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '6px 16px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + New Task
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
              color: '#64748b',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* New task form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'white', borderRadius: 12,
            padding: 28, width: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>New Task</h2>
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
                style={{ display: 'block', width: '100%', marginBottom: 12, padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
              />
              <input
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask((s) => ({ ...s, description: e.target.value }))}
                style={{ display: 'block', width: '100%', marginBottom: 12, padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask((s) => ({ ...s, priority: e.target.value }))}
                style={{ display: 'block', width: '100%', marginBottom: 20, padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Board */}
      <div style={{ padding: 24 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {STATUSES.map((status) => (
              <Column key={status} status={status} tasks={columns[status]} />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}