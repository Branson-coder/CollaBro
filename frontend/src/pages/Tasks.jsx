import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'

export default function TasksPage() {
  const { tasks, loading, fetchTasks, createTask, deleteTask } = useTaskStore()
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => { fetchTasks() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({ title, description })
    setTitle('')
    setDescription('')
  }

  const handleLogout = () => { logout(); navigate('/login') }

  if (loading) return (
    <div className="loading-root">
      LOADING<span className="loading-dot">.</span><span className="loading-dot">.</span><span className="loading-dot">.</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="page-header">
        <div className="page-header-title">
          <span className="arrow">▸</span> My Tasks
          <span style={{ fontSize: 11, color: 'var(--muted-3)', background: 'var(--dark-2)', padding: '2px 8px' }}>{tasks.length}</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Sign out</button>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        <form onSubmit={handleCreate} style={{ marginBottom: 32, border: '1px solid var(--border)', background: '#ffffff', overflow: 'hidden' }}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
            <input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--dark)', background: '#ffffff', border: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--dark)', background: '#ffffff', border: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--border-2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-submit">Add Task</button>
          </div>
        </form>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-label">NO TASKS</p>
            <p className="empty-sub">Add something above to get started.</p>
          </div>
        ) : (
          <div className="row-list">
            {tasks.map((task) => (
              <div key={task.id} className="row-item task-item" style={{ padding: '14px 16px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  {task.description && (
                    <div style={{ marginTop: 2, fontSize: 12, color: 'var(--muted-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</div>
                  )}
                </div>
                <button onClick={() => deleteTask(task.id)} className="task-delete" style={{ marginLeft: 16 }} aria-label="Delete task">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}