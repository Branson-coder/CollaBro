import { useEffect, useState } from 'react'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'
import { attachmentsApi } from '../api/attachments.api'
import EditTaskModal from './EditTaskModal'

const PRIORITY = {
  critical: { label: 'Critical', color: '#ef4444' },
  high:     { label: 'High',     color: '#f97316' },
  medium:   { label: 'Medium',   color: '#eab308' },
  low:      { label: 'Low',      color: '#22c55e' },
}
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : null
}
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

function MetaCell({ label, children }) {
  return (
    <div style={{ background: '#ffffff', padding: '10px 14px' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, color: 'var(--muted-1)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
      {children}
    </div>
  )
}

export default function TaskDetailModal({ task, onClose }) {
  const myRole       = useTeamStore((s) => s.myRole)
  const { user }     = useAuthStore()
  const [attachments, setAttachments] = useState([])
  const [editOpen, setEditOpen]       = useState(false)

  const isViewer     = myRole === 'viewer'
  const isOwnerAdmin = ['owner', 'admin'].includes(myRole)
  const canEdit      = !isViewer && (isOwnerAdmin || task.user_id === user?.id)

  const now        = new Date()
  const due        = task.due_date ? new Date(task.due_date) : null
  const isOverdue  = due && due < now && task.status !== 'done'
  const isDueToday = due && due.toDateString() === now.toDateString()
  const p          = PRIORITY[task.priority] || PRIORITY.low

  useEffect(() => {
    attachmentsApi.getAll(task.id).then(({ data }) => setAttachments(data)).catch(() => {})
  }, [task.id])

  if (editOpen) return <EditTaskModal task={task} onClose={() => setEditOpen(false)} />

  const assignees = task.assignees || []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box lg" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, color: 'var(--muted-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {STATUS_LABELS[task.status] || task.status}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {canEdit && (
              <button onClick={() => setEditOpen(true)} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--sans)', color: 'var(--dark)', background: 'var(--cream)', border: 'none', cursor: 'pointer' }}>
                Edit
              </button>
            )}
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-scroll">

          {/* Title + badges */}
          <div className="modal-section">
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dark)', margin: '0 0 10px', lineHeight: 1.3 }}>{task.title}</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, padding: '3px 8px', background: 'var(--border-2)', color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {STATUS_LABELS[task.status]}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, padding: '3px 8px', background: `${p.color}18`, color: p.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {p.label}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="modal-section">
            <p style={{ fontSize: 13, color: task.description ? 'var(--muted-3)' : 'var(--border)', lineHeight: 1.6, margin: 0, fontStyle: task.description ? 'normal' : 'italic' }}>
              {task.description || 'No description'}
            </p>
          </div>

          {/* Meta grid */}
          <div className="modal-section">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', border: '1px solid var(--border)' }}>

              <MetaCell label="Due Date">
                <p style={{ fontSize: 12, margin: 0, color: isOverdue ? 'var(--danger)' : isDueToday ? '#f97316' : !due ? 'var(--border)' : 'var(--dark)', fontWeight: isOverdue || isDueToday ? 600 : 400 }}>
                  {due ? (isOverdue ? '! ' : isDueToday ? '~ ' : '') + fmt(task.due_date) : '—'}
                </p>
              </MetaCell>

              <MetaCell label="Assignees">
                {assignees.length === 0 ? (
                  <p style={{ fontSize: 12, margin: 0, color: 'var(--border)' }}>—</p>
                ) : (
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {assignees.slice(0, 5).map((a) => (
                      <div key={a.id} title={a.email} style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--dark)', color: 'var(--cream)', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {a.email[0].toUpperCase()}
                      </div>
                    ))}
                    {assignees.length > 5 && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--dark-2)', color: 'var(--muted-1)', fontFamily: 'var(--mono)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        +{assignees.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </MetaCell>

              <MetaCell label="Created">
                <p style={{ fontSize: 12, margin: 0, color: 'var(--dark)' }}>{fmt(task.created_at) || '—'}</p>
              </MetaCell>

              <MetaCell label="Updated">
                <p style={{ fontSize: 12, margin: 0, color: 'var(--dark)' }}>{fmt(task.updated_at) || '—'}</p>
              </MetaCell>

            </div>
          </div>

          {/* Attachments */}
          <div className="modal-section">
            <div className="att-header">
              <span className="att-label">Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
              {canEdit && (
                <span onClick={() => setEditOpen(true)} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted-1)', cursor: 'pointer' }}>
                  manage in edit →
                </span>
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
                      <a href={url} download={att.originalname} className="att-btn">↓</a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}