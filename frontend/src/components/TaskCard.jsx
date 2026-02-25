import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { useTaskStore } from '../store/taskStore'
import EditTaskModal from './EditTaskModal'

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

export default function TaskCard({ task, index }) {
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const [editing, setEditing] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm(`Delete "${task.title}"?`)) return
    await deleteTask(task.id)
  }

  const now = new Date()
  const due = task.due_date ? new Date(task.due_date) : null
  const isOverdue  = due && due < now && task.status !== 'done'
  const isDueToday = due && due.toDateString() === now.toDateString()

  return (
    <>
      <Draggable draggableId={String(task.id)} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setEditing(true)}
            style={{
              background: snapshot.isDragging ? '#f0f4ff' : 'white',
              border: '1px solid #e2e8f0',
              borderLeft: `4px solid ${PRIORITY_COLORS[task.priority] || '#94a3b8'}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 8,
              boxShadow: snapshot.isDragging
                ? '0 8px 24px rgba(0,0,0,0.12)'
                : '0 1px 3px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              position: 'relative',
              ...provided.draggableProps.style,
            }}
          >
            {/* Delete button */}
            <button
              onClick={handleDelete}
              title="Delete task"
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#cbd5e1',
                fontSize: 16, lineHeight: 1,
                padding: '0 2px', borderRadius: 4,
              }}
              onMouseEnter={(e) => e.target.style.color = '#ef4444'}
              onMouseLeave={(e) => e.target.style.color = '#cbd5e1'}
            >
              ×
            </button>

            <p style={{
              margin: 0, fontWeight: 600,
              fontSize: 14, color: '#1e293b',
              paddingRight: 20,
            }}>
              {task.title}
            </p>

            {task.description && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                {task.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase',
                color: PRIORITY_COLORS[task.priority] || '#94a3b8',
              }}>
                {task.priority}
              </span>

              {due && (
                <span style={{
                  fontSize: 11,
                  fontWeight: isOverdue || isDueToday ? 600 : 400,
                  color: isOverdue ? '#ef4444' : isDueToday ? '#f97316' : '#94a3b8',
                }}>
                  {isOverdue  ? '⚠ Overdue' :
                   isDueToday ? '⏰ Due today' :
                   `Due ${due.toLocaleDateString()}`}
                </span>
              )}

              {task.assignee_email && (
                <span style={{
                  fontSize: 11, background: '#f1f5f9',
                  borderRadius: 12, padding: '2px 8px',
                  color: '#475569', marginLeft: 'auto',
                }}>
                  {task.assignee_email}
                </span>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {editing && (
        <EditTaskModal task={task} onClose={() => setEditing(false)} />
      )}
    </>
  )
}