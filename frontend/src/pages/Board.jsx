import { useEffect, useRef, useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import { useTeamStore } from '../store/teamStore'
import { useSocket } from '../hooks/useSocket'
import { attachmentsApi } from '../api/attachments.api'
import Column from '../components/Column'
import TeamSidebar from '../components/TeamSidebar'
import ActivityFeed from '../components/ActivityFeed'

const STATUSES = ['todo', 'in_progress', 'review', 'done']

const EMPTY_TASK = { title: '', description: '', priority: 'medium', due_date: '' }

function formatSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Board() {
  const { tasks, fetchTasks, updateTask, createTask, clearTasks } = useTaskStore()
  const { logout, user } = useAuthStore()
  const { activeTeam, fetchTeams } = useTeamStore()
  const navigate = useNavigate()

  const teamId = activeTeam?.id || null
  useSocket(teamId)

  const [newTask, setNewTask] = useState(EMPTY_TASK)
  const [showForm, setShowForm] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])  // { file, id }[]
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchTeams() }, [])
  useEffect(() => { if (teamId !== undefined) fetchTasks(teamId) }, [teamId])

  const columns = STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {})

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const taskId = parseInt(draggableId)
    const newStatus = destination.droppableId
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    useTaskStore.setState((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, position: destination.index } : t
      ),
    }))

    await updateTask(taskId, { status: newStatus, position: destination.index, team_id: task.team_id })
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const entries = files.map((file) => ({ file, id: `${file.name}-${Date.now()}-${Math.random()}` }))
    setPendingFiles((prev) => [...prev, ...entries])
    e.target.value = ''
  }

  const removeFile = (id) => setPendingFiles((prev) => prev.filter((f) => f.id !== id))

  const closeForm = () => {
    setShowForm(false)
    setNewTask(EMPTY_TASK)
    setPendingFiles([])
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    setSubmitting(true)
    try {
      const created = await createTask({
        ...newTask,
        due_date: newTask.due_date || null,
        team_id: teamId,
      })
      // Upload any queued files against the new task id
      if (created?.id && pendingFiles.length > 0) {
        await Promise.all(pendingFiles.map(({ file }) => attachmentsApi.upload(created.id, file)))
      }
      closeForm()
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearTasks()
    logout()
    navigate('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .board-root {
          font-family: 'IBM Plex Sans', sans-serif;
          background: #f5f4f0;
          color: #1a1a1a;
        }

        .board-header {
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
        }

        .header-title span {
          color: #6b7280;
          margin-right: 8px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .header-user {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #4b5563;
          padding: 0 12px;
          border-right: 1px solid #2e2e2e;
          margin-right: 4px;
        }

        .btn-ghost {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #9ca3af;
          background: transparent;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: color 0.15s;
        }

        .btn-ghost:hover { color: #e8e4d9; }

        .btn-ghost.active {
          color: #e8e4d9;
          background: #2e2e2e;
        }

        .btn-primary {
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1a1a1a;
          background: #e8e4d9;
          border: none;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.15s;
        }

        .btn-primary:hover { background: #ffffff; }

        .btn-logout {
          padding: 6px 12px;
          font-size: 12px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #4b5563;
          background: transparent;
          border: none;
          cursor: pointer;
          border-left: 1px solid #2e2e2e;
          margin-left: 4px;
          transition: color 0.15s;
        }

        .btn-logout:hover { color: #ef4444; }

        .board-main {
          padding: 32px;
          overflow-x: auto;
          flex: 1;
        }

        .columns-wrapper {
          display: flex;
          gap: 1px;
          align-items: flex-start;
          min-width: max-content;
          padding-bottom: 16px;
          background: #d6d3cc;
          border: 1px solid #d6d3cc;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(26, 26, 26, 0.6);
        }

        .modal-box {
          width: 100%;
          max-width: 440px;
          background: #f5f4f0;
          border: 1px solid #d6d3cc;
          padding: 0;
          overflow: hidden;
        }

        .modal-header {
          padding: 16px 24px;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          color: #e8e4d9;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .modal-team {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #4b5563;
        }

        .modal-body {
          padding: 24px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-family: 'IBM Plex Mono', monospace;
        }

        .field-group {
          margin-bottom: 16px;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1a1a1a;
          background: #ffffff;
          border: 1px solid #d6d3cc;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          border-color: #1a1a1a;
        }

        .form-textarea {
          height: 80px;
          resize: none;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          cursor: pointer;
        }

        .modal-footer {
          padding: 16px 24px;
          background: #eceae5;
          border-top: 1px solid #d6d3cc;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-cancel {
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #6b7280;
          background: transparent;
          border: 1px solid #d6d3cc;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-cancel:hover {
          border-color: #1a1a1a;
          color: #1a1a1a;
        }

        .btn-submit {
          padding: 8px 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #e8e4d9;
          background: #1a1a1a;
          border: 1px solid #1a1a1a;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: background 0.15s;
        }

        .btn-submit:hover { background: #2e2e2e; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Two-column row */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* File upload */
        .file-drop-zone {
          border: 1px dashed #d6d3cc;
          background: #ffffff;
          padding: 14px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          text-align: center;
        }

        .file-drop-zone:hover {
          border-color: #1a1a1a;
          background: #fafaf8;
        }

        .file-drop-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #9ca3af;
          letter-spacing: 0.04em;
          pointer-events: none;
        }

        .file-list {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #d6d3cc;
          border: 1px solid #d6d3cc;
        }

        .file-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: #ffffff;
          gap: 8px;
        }

        .file-name {
          font-size: 12px;
          color: #1a1a1a;
          font-weight: 500;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        .file-size {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #9ca3af;
          flex-shrink: 0;
        }

        .file-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #d6d3cc;
          font-size: 14px;
          line-height: 1;
          padding: 0 2px;
          transition: color 0.15s;
          flex-shrink: 0;
        }

        .file-remove:hover { color: #ef4444; }
      `}</style>

      <div className="board-root" style={{ display: 'flex', minHeight: '100vh' }}>
        <TeamSidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

          <header className="board-header">
            <h2 className="header-title">
              <span>▸</span>
              {activeTeam ? activeTeam.name : 'My Tasks'}
            </h2>

            <div className="header-right">
              {user?.email && (
                <span className="header-user">{user.email}</span>
              )}

              <button
                onClick={() => setActivityOpen((o) => !o)}
                className={`btn-ghost ${activityOpen ? 'active' : ''}`}
              >
                Activity
              </button>

              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                + New Task
              </button>

              <button onClick={handleLogout} className="btn-logout">
                Sign out
              </button>
            </div>
          </header>

          <main className="board-main">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="columns-wrapper">
                {STATUSES.map((status) => (
                  <Column key={status} status={status} tasks={columns[status]} />
                ))}
              </div>
            </DragDropContext>
          </main>
        </div>

        <ActivityFeed isOpen={activityOpen} onClose={() => setActivityOpen(false)} />

        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>

              <div className="modal-header">
                <span className="modal-title">New Task</span>
                {activeTeam && (
                  <span className="modal-team">in {activeTeam.name}</span>
                )}
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="field-group">
                    <label className="field-label">Title</label>
                    <input
                      autoFocus
                      placeholder="What needs to be done?"
                      value={newTask.title}
                      onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
                      className="form-input"
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Description</label>
                    <textarea
                      placeholder="Optional details..."
                      value={newTask.description}
                      onChange={(e) => setNewTask((s) => ({ ...s, description: e.target.value }))}
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-row field-group">
                    <div>
                      <label className="field-label">Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask((s) => ({ ...s, priority: e.target.value }))}
                        className="form-select"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Due Date</label>
                      <input
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask((s) => ({ ...s, due_date: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label">Attachments</label>
                    <div
                      className="file-drop-zone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="file-drop-label">+ attach files</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {pendingFiles.length > 0 && (
                      <div className="file-list">
                        {pendingFiles.map(({ file, id }) => (
                          <div key={id} className="file-row">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{formatSize(file.size)}</span>
                            <button
                              type="button"
                              className="file-remove"
                              onClick={() => removeFile(id)}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={closeForm} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Task'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </div>
    </>
  )
}