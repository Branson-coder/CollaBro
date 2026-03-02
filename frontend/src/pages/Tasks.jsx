import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'

export default function TasksPage() {
  const { tasks, loading, fetchTasks, createTask, deleteTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => { fetchTasks() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({ title, description })
    setTitle('')
    setDescription('')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .loading-root {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f5f4f0;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #6b7280;
          letter-spacing: 0.08em;
        }
        .loading-dot {
          display: inline-block;
          animation: blink 1.2s step-start infinite;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
      <div className="loading-root">
        LOADING<span className="loading-dot">.</span><span className="loading-dot">.</span><span className="loading-dot">.</span>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .tasks-root {
          min-height: 100vh;
          background: #f5f4f0;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1a1a1a;
        }

        .tasks-header {
          height: 52px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #1a1a1a;
          border-bottom: 1px solid #2e2e2e;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #e8e4d9;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-count {
          font-size: 11px;
          color: #4b5563;
          background: #2e2e2e;
          padding: 2px 8px;
        }

        .btn-logout {
          padding: 6px 12px;
          font-size: 12px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #4b5563;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
        }
        .btn-logout:hover { color: #ef4444; }

        .tasks-body {
          max-width: 640px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        /* Form */
        .create-form {
          margin-bottom: 32px;
          border: 1px solid #d6d3cc;
          background: #ffffff;
          overflow: hidden;
        }

        .form-inner {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #d6d3cc;
        }

        .form-input {
          width: 100%;
          padding: 11px 14px;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1a1a1a;
          background: #ffffff;
          border: none;
          outline: none;
          box-sizing: border-box;
          transition: background 0.15s;
        }

        .form-input::placeholder { color: #9ca3af; }
        .form-input:focus { background: #fafaf8; }

        .form-footer {
          padding: 12px 16px;
          background: #eceae5;
          border-top: 1px solid #d6d3cc;
          display: flex;
          justify-content: flex-end;
        }

        .btn-submit {
          padding: 7px 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #e8e4d9;
          background: #1a1a1a;
          border: none;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: background 0.15s;
        }
        .btn-submit:hover { background: #2e2e2e; }

        /* Task list */
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #d6d3cc;
          border: 1px solid #d6d3cc;
        }

        .task-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: #ffffff;
          transition: background 0.1s;
        }

        .task-item:hover { background: #fafaf8; }

        .task-content { flex: 1; min-width: 0; }

        .task-title {
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .task-description {
          margin-top: 2px;
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-delete {
          margin-left: 16px;
          padding: 5px 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #d6d3cc;
          flex-shrink: 0;
          transition: color 0.15s;
          line-height: 0;
          opacity: 0;
          transition: opacity 0.15s, color 0.15s;
        }

        .task-item:hover .btn-delete { opacity: 1; }
        .btn-delete:hover { color: #ef4444; }

        /* Empty state */
        .empty-state {
          padding: 60px 24px;
          text-align: center;
          border: 1px dashed #d6d3cc;
          background: #fafaf8;
        }

        .empty-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #9ca3af;
          letter-spacing: 0.04em;
        }

        .empty-sub {
          margin-top: 6px;
          font-size: 12px;
          color: #d6d3cc;
        }
      `}</style>

      <div className="tasks-root">
        <header className="tasks-header">
          <div className="header-title">
            <span>▸</span> My Tasks
            <span className="header-count">{tasks.length}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">Sign out</button>
        </header>

        <div className="tasks-body">

          <form onSubmit={handleCreate} className="create-form">
            <div className="form-inner">
              <input
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                autoFocus
              />
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-footer">
              <button type="submit" className="btn-submit">Add Task</button>
            </div>
          </form>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-label">NO TASKS</p>
              <p className="empty-sub">Add something above to get started.</p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn-delete"
                    aria-label="Delete task"
                  >
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
    </>
  )
}