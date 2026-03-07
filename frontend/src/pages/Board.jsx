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

  const [newTask, setNewTask]           = useState(EMPTY_TASK)
  const [showForm, setShowForm]         = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [submitting, setSubmitting]     = useState(false)
  const [myTasksOnly, setMyTasksOnly]   = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchTeams() }, [])
  useEffect(() => { if (teamId !== undefined) fetchTasks(teamId) }, [teamId])

  const columns = STATUSES.reduce((acc, status) => {
    let filtered = tasks.filter((t) => t.status === status)
    if (myTasksOnly && user) {
      filtered = filtered.filter((t) =>
        t.assignees?.some((a) => a.id === user.id) || t.user_id === user.id
      )
    }
    acc[status] = filtered.sort((a, b) => a.position - b.position)
    return acc
  }, {})

  const onDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    const taskId = parseInt(draggableId)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    useTaskStore.setState((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, status: destination.droppableId, position: destination.index } : t),
    }))
    await updateTask(taskId, { status: destination.droppableId, position: destination.index, team_id: task.team_id })
  }

  const handleFileSelect = (e) => {
    const entries = Array.from(e.target.files).map((file) => ({ file, id: `${file.name}-${Date.now()}-${Math.random()}` }))
    setPendingFiles((prev) => [...prev, ...entries])
    e.target.value = ''
  }

  const closeForm = () => { setShowForm(false); setNewTask(EMPTY_TASK); setPendingFiles([]) }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    setSubmitting(true)
    try {
      const created = await createTask({ ...newTask, due_date: newTask.due_date || null, team_id: teamId })
      if (created?.id && pendingFiles.length > 0) {
        await Promise.all(pendingFiles.map(({ file }) => attachmentsApi.upload(created.id, file)))
      }
      closeForm()
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => { clearTasks(); logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <TeamSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header className="page-header">
          <h2 className="page-header-title">
            <span className="arrow">▸</span>
            {activeTeam ? activeTeam.name : 'My Tasks'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user?.username || user?.email && <span className="header-user">{user.email}</span>}
            <button onClick={() => setMyTasksOnly((o) => !o)} className={`btn-ghost ${myTasksOnly ? 'active' : ''}`}>
              {myTasksOnly ? '▸ My Tasks' : 'My Tasks'}
            </button>
            <button onClick={() => setActivityOpen((o) => !o)} className={`btn-ghost ${activityOpen ? 'active' : ''}`}>
              Activity
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">+ New Task</button>
            <button onClick={handleLogout} className="btn-logout">Sign out</button>
          </div>
        </header>

        <main style={{ padding: 32, overflowX: 'auto', flex: 1 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: 'flex', gap: 1, alignItems: 'flex-start', minWidth: 'max-content', background: 'var(--border)', border: '1px solid var(--border)' }}>
              {STATUSES.map((status) => <Column key={status} status={status} tasks={columns[status]} />)}
            </div>
          </DragDropContext>
        </main>
      </div>

      <ActivityFeed isOpen={activityOpen} onClose={() => setActivityOpen(false)} />

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-header-title">New Task</span>
              {activeTeam && <span className="modal-header-meta">in {activeTeam.name}</span>}
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Title</label>
                  <input autoFocus placeholder="What needs to be done?" value={newTask.title} onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))} className="field-input" />
                </div>
                <div className="field-group">
                  <label className="field-label">Description</label>
                  <textarea placeholder="Optional details..." value={newTask.description} onChange={(e) => setNewTask((s) => ({ ...s, description: e.target.value }))} className="field-textarea" />
                </div>
                <div className="two-col field-group">
                  <div>
                    <label className="field-label">Priority</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask((s) => ({ ...s, priority: e.target.value }))} className="field-select">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Due Date</label>
                    <input type="date" value={newTask.due_date} onChange={(e) => setNewTask((s) => ({ ...s, due_date: e.target.value }))} className="field-input" />
                  </div>
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Attachments</label>
                  <div className="file-drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <span className="file-drop-label">+ attach files</span>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                  </div>
                  {pendingFiles.length > 0 && (
                    <div className="row-list" style={{ marginTop: 8 }}>
                      {pendingFiles.map(({ file, id }) => (
                        <div key={id} className="row-item" style={{ justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file.name}</span>
                          <span className="file-size">{formatSize(file.size)}</span>
                          <button type="button" className="file-remove" onClick={() => setPendingFiles((p) => p.filter((f) => f.id !== id))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}