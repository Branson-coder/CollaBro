import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { useTaskStore } from '../store/taskStore'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'
import TaskDetailModal from './TaskDetailModal'

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444' },
  high:     { label: 'High',     color: '#f97316' },
  medium:   { label: 'Medium',   color: '#eab308' },
  low:      { label: 'Low',      color: '#22c55e' },
}

export default function TaskCard({ task, index }) {
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const myRole     = useTeamStore((s) => s.myRole)
  const { user }   = useAuthStore()
  const [detailOpen, setDetailOpen] = useState(false)

  const isViewer      = myRole === 'viewer'
  const isOwnerOrAdmin = ['owner', 'admin'].includes(myRole)
  const isMyTask      = task.user_id === user?.id
  const canDelete     = !isViewer && (isOwnerOrAdmin || isMyTask)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm(`Delete "${task.title}"?`)) return
    await deleteTask(task.id)
  }

  const now       = new Date()
  const due       = task.due_date ? new Date(task.due_date) : null
  const isOverdue = due && due < now && task.status !== 'done'
  const isDueToday = due && due.toDateString() === now.toDateString()

  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .task-card {
          font-family: 'IBM Plex Sans', sans-serif;
          background: #ffffff;
          border-bottom: 1px solid #eceae5;
          padding: 10px 12px;
          cursor: pointer;
          position: relative;
          transition: background 0.1s;
          user-select: none;
        }

        .task-card:hover { background: #fafaf8; }

        .task-card.is-dragging {
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 50;
          border: 1px solid #d6d3cc;
        }

        .task-card.is-viewer { cursor: default; }

        .task-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .task-priority-pip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          color: #9ca3af;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .task-priority-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .task-delete {
          opacity: 0;
          padding: 2px 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #d6d3cc;
          line-height: 0;
          transition: opacity 0.15s, color 0.15s;
        }

        .task-card:hover .task-delete { opacity: 1; }
        .task-delete:hover { color: #ef4444; }

        .task-title {
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1.4;
          margin: 0 0 2px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .task-description {
          font-size: 11px;
          color: #9ca3af;
          line-height: 1.4;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          margin: 0;
        }

        .task-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .task-due {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          padding: 2px 6px;
          font-weight: 500;
        }

        .task-due.normal  { color: #6b7280; background: #f3f4f6; }
        .task-due.overdue { color: #ef4444; background: #fef2f2; }
        .task-due.today   { color: #f97316; background: #fff7ed; }

        .task-assignee {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #1a1a1a;
          color: #e8e4d9;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>

      <Draggable
        draggableId={String(task.id)}
        index={index}
        isDragDisabled={isViewer}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setDetailOpen(true)}
            className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''} ${isViewer ? 'is-viewer' : ''}`}
            style={{ ...provided.draggableProps.style }}
          >
            <div className="task-card-top">
              <div className="task-priority-pip">
                <span
                  className="task-priority-dot"
                  style={{ background: p.color }}
                />
                {p.label}
              </div>

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="task-delete"
                  aria-label="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <p className="task-title">{task.title}</p>

            {task.description && (
              <p className="task-description">{task.description}</p>
            )}

            <div className="task-footer">
              {due ? (
                <span className={`task-due ${isOverdue ? 'overdue' : isDueToday ? 'today' : 'normal'}`}>
                  {isOverdue ? '! ' : ''}{due.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              ) : <span />}

              {task.assignee_email && (
                <div className="task-assignee" title={task.assignee_email}>
                  {task.assignee_email[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {detailOpen && (
        <TaskDetailModal task={task} onClose={() => setDetailOpen(false)} />
      )}
    </>
  )
}