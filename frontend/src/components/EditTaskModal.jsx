import { useState, useRef, useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import { useTeamStore } from '../store/teamStore'
import { attachmentsApi } from '../api/attachments.api'
import { useTaskStore } from '../store/taskStore'

function formatSize(bytes) {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimetype) {
  if (mimetype?.startsWith('image/'))                               return '↳ img'
  if (mimetype?.includes('pdf'))                                    return '↳ pdf'
  if (mimetype?.includes('word') || mimetype?.includes('document')) return '↳ doc'
  if (mimetype?.includes('sheet') || mimetype?.includes('excel'))   return '↳ xls'
  return '↳ file'
}

export default function EditTaskModal({ task, onClose }) {
  const updateTask    = useTaskStore((s) => s.updateTask)
  const { user }      = useAuthStore()
  const myRole        = useTeamStore((s) => s.myRole)
  const isViewer      = myRole === 'viewer'
  const isOwnerAdmin  = ['owner', 'admin'].includes(myRole)

  const [form, setForm] = useState({
    title:       task.title       || '',
    description: task.description || '',
    priority:    task.priority    || 'medium',
    due_date:    task.due_date
      ? new Date(task.due_date).toISOString().split('T')[0]
      : '',
  })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  useEffect(() => { fetchAttachments() }, [task.id])

  const fetchAttachments = async () => {
    try {
      const { data } = await attachmentsApi.getAll(task.id)
      setAttachments(data)
    } catch { /* silent */ }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      await attachmentsApi.upload(task.id, file)
      await fetchAttachments()
    } catch {
      alert('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteAttachment = async (id) => {
    if (!confirm('Remove this attachment?')) return
    try {
      await attachmentsApi.delete(id)
      setAttachments((s) => s.filter((a) => a.id !== id))
    } catch {
      alert('Failed to remove attachment')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required')
    setLoading(true)
    try {
      await updateTask(task.id, { ...form, due_date: form.due_date || null })
      onClose()
    } catch {
      setError('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .edit-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(26,26,26,0.6);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .edit-box {
          width: 100%; max-width: 460px;
          background: #f5f4f0;
          border: 1px solid #d6d3cc;
          display: flex; flex-direction: column;
          max-height: 90vh;
          overflow: hidden;
        }

        .edit-header {
          height: 44px; padding: 0 20px;
          background: #1a1a1a;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }

        .edit-header-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: #e8e4d9; letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .edit-header-close {
          background: none; border: none;
          color: #4b5563; cursor: pointer;
          font-size: 18px; line-height: 1; padding: 0;
          transition: color 0.15s;
        }
        .edit-header-close:hover { color: #e8e4d9; }

        .edit-scroll {
          overflow-y: auto;
          flex: 1;
        }

        .edit-section {
          padding: 20px;
          border-bottom: 1px solid #d6d3cc;
        }

        .edit-section:last-child { border-bottom: none; }

        .field-group { margin-bottom: 14px; }
        .field-group:last-child { margin-bottom: 0; }

        .field-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 500;
          color: #9ca3af; letter-spacing: 0.06em;
          text-transform: uppercase; margin-bottom: 5px;
        }

        .field-input,
        .field-textarea,
        .field-select {
          width: 100%; padding: 9px 11px;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1a1a1a; background: #ffffff;
          border: 1px solid #d6d3cc; outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .field-input:focus,
        .field-textarea:focus,
        .field-select:focus { border-color: #1a1a1a; }

        .field-textarea { height: 72px; resize: none; }

        .field-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          cursor: pointer;
        }

        .date-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .error-msg {
          font-size: 11px; color: #ef4444;
          margin: 0 0 10px;
          font-family: 'IBM Plex Mono', monospace;
        }

        /* Attachments */
        .att-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }

        .att-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 500;
          color: #6b7280; letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .btn-upload {
          padding: 4px 10px;
          font-size: 11px; font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #4b5563; background: #ffffff;
          border: 1px solid #d6d3cc; cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-upload:hover { border-color: #1a1a1a; color: #1a1a1a; }
        .btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }

        .att-list {
          display: flex; flex-direction: column;
          gap: 1px; background: #d6d3cc;
          border: 1px solid #d6d3cc;
        }

        .att-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; background: #ffffff;
        }

        .att-icon {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; color: #9ca3af;
          flex-shrink: 0; width: 36px;
        }

        .att-preview {
          width: 36px; height: 36px;
          object-fit: cover; flex-shrink: 0;
        }

        .att-info { flex: 1; min-width: 0; }

        .att-name {
          font-size: 12px; font-weight: 500;
          color: #1a1a1a; overflow: hidden;
          white-space: nowrap; text-overflow: ellipsis;
          margin: 0 0 1px;
        }

        .att-meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; color: #9ca3af; margin: 0;
        }

        .att-actions { display: flex; gap: 4px; flex-shrink: 0; }

        .att-btn {
          font-size: 10px; padding: 3px 8px;
          border: 1px solid #d6d3cc; background: #ffffff;
          color: #6b7280; cursor: pointer;
          text-decoration: none; font-weight: 500;
          font-family: 'IBM Plex Sans', sans-serif;
          transition: border-color 0.15s;
          display: inline-block;
        }
        .att-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }
        .att-btn.danger:hover { border-color: #ef4444; color: #ef4444; }

        .att-empty {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; color: #d6d3cc;
        }

        /* Footer */
        .edit-footer {
          padding: 12px 20px;
          background: #eceae5;
          border-top: 1px solid #d6d3cc;
          display: flex; justify-content: flex-end;
          gap: 8px; flex-shrink: 0;
        }

        .btn-cancel {
          padding: 7px 16px;
          font-size: 12px; font-weight: 500;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #6b7280; background: transparent;
          border: 1px solid #d6d3cc; cursor: pointer;
          transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #1a1a1a; color: #1a1a1a; }

        .btn-save {
          padding: 7px 20px;
          font-size: 12px; font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #e8e4d9; background: #1a1a1a;
          border: 1px solid #1a1a1a; cursor: pointer;
          transition: background 0.15s;
        }
        .btn-save:hover { background: #2e2e2e; }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="edit-overlay" onClick={onClose}>
        <div className="edit-box" onClick={(e) => e.stopPropagation()}>

          <div className="edit-header">
            <span className="edit-header-title">Edit Task</span>
            <button className="edit-header-close" onClick={onClose}>×</button>
          </div>

          <div className="edit-scroll">
            <form onSubmit={handleSubmit}>

              {/* Fields */}
              <div className="edit-section">
                <div className="field-group">
                  <label className="field-label">Title</label>
                  <input autoFocus value={form.title} onChange={set('title')} className="field-input" />
                </div>
                <div className="field-group">
                  <label className="field-label">Description</label>
                  <textarea value={form.description} onChange={set('description')} className="field-textarea" />
                </div>
                <div className="date-row">
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

              {/* Attachments */}
              <div className="edit-section">
                <div className="att-section-header">
                  <span className="att-section-label">
                    Attachments {attachments.length > 0 && `(${attachments.length})`}
                  </span>
                  {!isViewer && (
                    <>
                      <button
                        type="button"
                        className="btn-upload"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? 'Uploading…' : '+ Upload'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                      />
                    </>
                  )}
                </div>

                {attachments.length === 0 ? (
                  <p className="att-empty">No attachments</p>
                ) : (
                  <div className="att-list">
                    {attachments.map((att) => {
                      const isImage = att.mimetype?.startsWith('image/')
                      const url = attachmentsApi.fileUrl(att.filename)
                      return (
                        <div key={att.id} className="att-row">
                          {isImage ? (
                            <img src={url} alt={att.originalname} className="att-preview" />
                          ) : (
                            <span className="att-icon">{fileIcon(att.mimetype)}</span>
                          )}
                          <div className="att-info">
                            <p className="att-name">{att.originalname}</p>
                            <p className="att-meta">
                              {formatSize(att.size)} · {att.uploader_email?.split('@')[0]}
                            </p>
                          </div>
                          <div className="att-actions">
                            <a href={url} download={att.originalname} className="att-btn">
                              ↓
                            </a>
                            {(att.user_id === user?.id || isOwnerAdmin) && (
                              <button
                                type="button"
                                className="att-btn danger"
                                onClick={() => handleDeleteAttachment(att.id)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="edit-footer">
                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  )
}