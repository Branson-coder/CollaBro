import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { useTaskStore } from '../store/taskStore'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'
import TaskDetailModal from './TaskDetailModal'

const PRIORITY = {
  critical: { label: 'Critical', color: '#ef4444' },
  high:     { label: 'High',     color: '#f97316' },
  medium:   { label: 'Medium',   color: '#eab308' },
  low:      { label: 'Low',      color: '#22c55e' },
}

const avatarStyle = { width: 20, height: 20, borderRadius: '50%', background: 'var(--dark)', color: 'var(--cream)', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const overflowStyle = { ...avatarStyle, background: 'var(--dark-2)', color: 'var(--muted-1)' }

export default function TaskCard({ task, index }) {
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const myRole     = useTeamStore((s) => s.myRole)
  const { user }   = useAuthStore()
  const [detailOpen, setDetailOpen] = useState(false)

  const isViewer       = myRole === 'viewer'
  const isOwnerOrAdmin = ['owner', 'admin'].includes(myRole)
  const canDelete      = !isViewer && (isOwnerOrAdmin || task.user_id === user?.id)

  const now        = new Date()
  const due        = task.due_date ? new Date(task.due_date) : null
  const isOverdue  = due && due < now && task.status !== 'done'
  const isDueToday = due && due.toDateString() === now.toDateString()
  const dueClass   = isOverdue ? 'overdue' : isDueToday ? 'today' : 'normal'

  const p = PRIORITY[task.priority] || PRIORITY.low

  return (
    <>
      <Draggable draggableId={String(task.id)} index={index} isDragDisabled={isViewer}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setDetailOpen(true)}
            className="task-card"
            style={{
              ...provided.draggableProps.style,
              fontFamily: 'var(--sans)',
              background: '#ffffff',
              borderBottom: '1px solid var(--border-2)',
              padding: '10px 12px',
              cursor: isViewer ? 'default' : 'pointer',
              userSelect: 'none',
              boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
              border: snapshot.isDragging ? '1px solid var(--border)' : undefined,
            }}
          >
            {/* Priority + delete */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, color: 'var(--muted-1)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                {p.label}
              </div>
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id) }}
                  className="task-delete"
                  aria-label="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Title + description */}
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)', lineHeight: 1.4, margin: '0 0 2px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.title}</p>
            {task.description && <p style={{ fontSize: 11, color: 'var(--muted-1)', lineHeight: 1.4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', margin: 0 }}>{task.description}</p>}

            {/* Footer: due date + assignee avatars */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              {due
                ? <span className={`task-due ${dueClass}`}>{isOverdue ? '! ' : ''}{due.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                : <span />
              }

              {task.assignees && task.assignees.length > 0 && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {task.assignees.slice(0, 3).map((a) => (
                    <div key={a.id} title={a.email} style={avatarStyle}>
                      {(a.username || a.email)[0].toUpperCase()}
                    </div>
                  ))}
                  {task.assignees.length > 3 && (
                    <div style={overflowStyle}>+{task.assignees.length - 3}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {detailOpen && <TaskDetailModal task={task} onClose={() => setDetailOpen(false)} />}
    </>
  )
}