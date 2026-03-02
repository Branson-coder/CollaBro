import { useEffect, useState } from 'react'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'
import { attachmentsApi } from '../api/attachments.api'
import EditTaskModal from './EditTaskModal'

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444' },
  high:     { label: 'High',     color: '#f97316' },
  medium:   { label: 'Medium',   color: '#eab308' },
  low:      { label: 'Low',      color: '#22c55e' },
}

const STATUS_LABELS = {
  todo:        'To Do',
  in_progress: 'In Progress',
  review:      'Review',
  done:        'Done',
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

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

export default function TaskDetailModal({ task, onClose }) {
  const myRole        = useTeamStore((s) => s.myRole)
  const { user }      = useAuthStore()
  const [attachments, setAttachments] = useState([])
  const [editOpen, setEditOpen]       = useState(false)

  const isViewer      = myRole === 'viewer'
  const isOwnerAdmin  = ['owner', 'admin'].includes(myRole)
  const isMyTask      = task.user_id === user?.id
  const canEdit       = !isViewer && (isOwnerAdmin || isMyTask)

  const now        = new Date()
  const due        = task.due_date ? new Date(task.due_date) : null
  const isOverdue  = due && due < now && task.status !== 'done'
  const isDueToday = due && due.toDateString() === now.toDateString()

  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low

  useEffect(() => {
    attachmentsApi.getAll(task.id)
      .then(({ data }) => setAttachments(data))
      .catch(() => {})
  }, [task.id])

  if (editOpen) {
    return <EditTaskModal task={task} onClose={() => setEditOpen(false)} />
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .detail-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(26,26,26,0.6);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .detail-box {
          width: 100%; max-width: 540px;
          background: #f5f4f0;
          border: 1px solid #d6d3cc;
          display: flex; flex-direction: column;
          max-height: 90vh; overflow: hidden;
        }

        .detail-header {
          padding: 0 20px;
          height: 44px;
          background: #1a1a1a;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; gap: 12px;
        }

        .detail-status {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 500;
          color: #4b5563; letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .detail-header-actions {
          display: flex; align-items: center; gap: 6px;
        }

        .detail-edit-btn {
          padding: 4px 12px;
          font-size: 11px; font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1a1a1a; background: #e8e4d9;
          border: none; cursor: pointer;
          transition: background 0.15s;
        }
        .detail-edit-btn:hover { background: #ffffff; }

        .detail-close {
          background: none; border: none;
          color: #4b5563; cursor: pointer;
          font-size: 18px; line-height: 1; padding: 0;
          transition: color 0.15s;
        }
        .detail-close:hover { color: #e8e4d9; }

        .detail-scroll { overflow-y: auto; flex: 1; }

        .detail-section {
          padding: 20px;
          border-bottom: 1px solid #d6d3cc;
        }

        .detail-section:last-child { border-bottom: none; }

        .detail-title {
          font-size: 16px; font-weight: 600;
          color: #1a1a1a; margin: 0 0 10px;
          line-height: 1.3;
        }

        .detail-badges {
          display: flex; align-items: center; gap: 6px;
        }

        .badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 500;
          padding: 3px 8px; letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .badge-status {
          background: #eceae5; color: #6b7280;
        }

        .detail-description {
          font-size: 13px; color: #4b5563;
          line-height: 1.6; margin: 0;
        }

        .detail-description.empty { color: #d6d3cc; font-style: italic; }

        /* Meta grid */
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0px;
          background: #d6d3cc;
          border: 1px solid #d6d3cc;
        }

        .meta-cell {
          background: #ffffff;
          padding: 10px 14px;
        }

        .meta-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px; font-weight: 500;
          color: #9ca3af; letter-spacing: 0.07em;
          text-transform: uppercase; margin: 0 0 3px;
        }

        .meta-value {
          font-size: 12px; color: #1a1a1a; margin: 0;
        }

        .meta-value.overdue { color: #ef4444; font-weight: 600; }
        .meta-value.today   { color: #f97316; font-weight: 600; }
        .meta-value.empty   { color: #d6d3cc; }

        /* Attachments */
        .att-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }

        .att-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 500;
          color: #6b7280; letter-spacing: 0.06em;
          text-transform: uppercase;
        }

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

        .att-download {
          font-size: 10px; padding: 3px 10px;
          border: 1px solid #d6d3cc; background: #ffffff;
          color: #6b7280; text-decoration: none;
          font-weight: 500; font-family: 'IBM Plex Sans', sans-serif;
          flex-shrink: 0; transition: border-color 0.15s;
          display: inline-block;
        }
        .att-download:hover { border-color: #1a1a1a; color: #1a1a1a; }

        .att-empty {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; color: #d6d3cc;
        }
      `}</style>

      <div className="detail-overlay" onClick={onClose}>
        <div className="detail-box" onClick={(e) => e.stopPropagation()}>

          <div className="detail-header">
            <span className="detail-status">
              {STATUS_LABELS[task.status] || task.status}
            </span>
            <div className="detail-header-actions">
              {canEdit && (
                <button className="detail-edit-btn" onClick={() => setEditOpen(true)}>
                  Edit
                </button>
              )}
              <button className="detail-close" onClick={onClose}>×</button>
            </div>
          </div>

          <div className="detail-scroll">

            {/* Title + badges */}
            <div className="detail-section">
              <h2 className="detail-title">{task.title}</h2>
              <div className="detail-badges">
                <span className="badge badge-status">{STATUS_LABELS[task.status]}</span>
                <span
                  className="badge"
                  style={{
                    background: `${p.color}18`,
                    color: p.color,
                  }}
                >
                  {p.label}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <p className={`detail-description ${!task.description ? 'empty' : ''}`}>
                {task.description || 'No description'}
              </p>
            </div>

            {/* Meta */}
            <div className="detail-section">
              <div className="meta-grid">
                <div className="meta-cell">
                  <p className="meta-label">Due Date</p>
                  <p className={`meta-value ${isOverdue ? 'overdue' : isDueToday ? 'today' : !due ? 'empty' : ''}`}>
                    {due
                      ? (isOverdue ? '! ' : isDueToday ? '~ ' : '') + formatDate(task.due_date)
                      : '—'}
                  </p>
                </div>
                <div className="meta-cell">
                  <p className="meta-label">Assignee</p>
                  <p className={`meta-value ${!task.assignee_email ? 'empty' : ''}`}>
                    {task.assignee_email || '—'}
                  </p>
                </div>
                <div className="meta-cell">
                  <p className="meta-label">Created</p>
                  <p className="meta-value">{formatDate(task.created_at) || '—'}</p>
                </div>
                <div className="meta-cell">
                  <p className="meta-label">Updated</p>
                  <p className="meta-value">{formatDate(task.updated_at) || '—'}</p>
                </div>
              </div>
            </div>

            {/* Attachments (read-only) */}
            <div className="detail-section">
              <div className="att-header">
                <span className="att-label">
                  Attachments {attachments.length > 0 && `(${attachments.length})`}
                </span>
                {canEdit && (
                  <span
                    style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9ca3af', cursor: 'pointer' }}
                    onClick={() => setEditOpen(true)}
                  >
                    manage in edit →
                  </span>
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
                        <a href={url} download={att.originalname} className="att-download">↓</a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}