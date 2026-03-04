import { useState, useRef, useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import { useTeamStore } from '../store/teamStore'
import { attachmentsApi } from '../api/attachments.api'

function formatSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function fileIcon(mime) {
  if (mime?.startsWith('image/'))                            return '↳ img'
  if (mime?.includes('pdf'))                                 return '↳ pdf'
  if (mime?.includes('word') || mime?.includes('document'))  return '↳ doc'
  if (mime?.includes('sheet') || mime?.includes('excel'))    return '↳ xls'
  return '↳ file'
}

export default function EditTaskModal({ task, onClose }) {
  const updateTask   = useTaskStore((s) => s.updateTask)
  const toggleAssign = useTaskStore((s) => s.toggleAssign)
  const tasks        = useTaskStore((s) => s.tasks)
  const { user }     = useAuthStore()
  const myRole       = useTeamStore((s) => s.myRole)
  const isViewer     = myRole === 'viewer'
  const isOwnerAdmin = ['owner', 'admin'].includes(myRole)

  const currentTask = tasks.find((t) => t.id === task.id) || task
  const assignees   = currentTask.assignees || []
  const isAssigned  = assignees.some((a) => a.id === user?.id)

  const [form, setForm] = useState({
    title:       task.title       || '',
    description: task.description || '',
    priority:    task.priority    || 'medium',
    due_date:    task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
  })
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading]     = useState(false)
  const [assigning, setAssigning]     = useState(false)
  const fileInputRef = useRef(null)

  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const fetchAttachments = async () => {
    try {
      const { data } = await attachmentsApi.getAll(task.id)
      setAttachments(data)
    } catch { /* silent */ }
  }

  useEffect(() => { fetchAttachments() }, [task.id])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try { await attachmentsApi.upload(task.id, file); await fetchAttachments() }
    catch { alert('Upload failed') }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleDeleteAttachment = async (id) => {
    if (!confirm('Remove this attachment?')) return
    try { await attachmentsApi.delete(id); setAttachments((s) => s.filter((a) => a.id !== id)) }
    catch { alert('Failed to remove attachment') }
  }

  const handleToggleAssign = async () => {
    setAssigning(true)
    try { await toggleAssign(task.id) } finally { setAssigning(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required')
    setLoading(true)
    try { await updateTask(task.id, { ...form, due_date: form.due_date || null }); onClose() }
    catch { setError('Failed to update task') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-header-title">Edit Task</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-scroll">
          <form onSubmit={handleSubmit}>

            {/* Fields */}
            <div className="modal-section">
              <div className="field-group">
                <label className="field-label">Title</label>
                <input autoFocus value={form.title} onChange={set('title')} className="field-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Description</label>
                <textarea value={form.description} onChange={set('description')} className="field-textarea" />
              </div>
              <div className="two-col">
                <div className="field-group">
                  <label className="field-label">Priority</label>
                  <select value={form.priority} onChange={set('priority')} className="field-select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Due Date</label>
                  <input type="date" value={form.due_date} onChange={set('due_date')} className="field-input" />
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
            </div>

            {/* Assignees */}
            <div className="modal-section">
              <div className="att-header">
                <span className="att-label">Assignees {assignees.length > 0 && `(${assignees.length})`}</span>
                {!isViewer && (
                  <button
                    type="button"
                    className="btn-upload"
                    disabled={assigning}
                    onClick={handleToggleAssign}
                    style={{
                      background: isAssigned ? '#fef2f2' : '#ffffff',
                      borderColor: isAssigned ? '#fecaca' : 'var(--border)',
                      color: isAssigned ? 'var(--danger)' : 'var(--muted-3)',
                    }}
                  >
                    {assigning ? '…' : isAssigned ? '− Unassign me' : '+ Assign me'}
                  </button>
                )}
              </div>

              {assignees.length === 0 ? (
                <p className="att-empty">No one assigned</p>
              ) : (
                <div className="row-list">
                  {assignees.map((a) => (
                    <div key={a.id} className="row-item">
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--dark)', color: 'var(--cream)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {a.email[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--dark)', fontWeight: 500 }}>
                        {a.email.split('@')[0]}
                        {a.id === user?.id && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted-1)', marginLeft: 6 }}>you</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="modal-section">
              <div className="att-header">
                <span className="att-label">Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
                {!isViewer && (
                  <>
                    <button type="button" className="btn-upload" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                      {uploading ? 'Uploading…' : '+ Upload'}
                    </button>
                    <input ref={fileInputRef} type="file" onChange={handleUpload} style={{ display: 'none' }} />
                  </>
                )}
              </div>
              {attachments.length === 0 ? <p className="att-empty">No attachments</p> : (
                <div className="row-list">
                  {attachments.map((att) => {
                    const url = attachmentsApi.fileUrl(att.filename)
                    return (
                      <div key={att.id} className="row-item">
                        {att.mimetype?.startsWith('image/') ? <img src={url} alt={att.originalname} className="att-preview" /> : <span className="att-icon">{fileIcon(att.mimetype)}</span>}
                        <div className="att-info">
                          <p className="att-name">{att.originalname}</p>
                          <p className="att-meta">{formatSize(att.size)} · {att.uploader_email?.split('@')[0]}</p>
                        </div>
                        <div className="att-actions">
                          <a href={url} download={att.originalname} className="att-btn">↓</a>
                          {(att.user_id === user?.id || isOwnerAdmin) && (
                            <button type="button" className="att-btn danger" onClick={() => handleDeleteAttachment(att.id)}>×</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}