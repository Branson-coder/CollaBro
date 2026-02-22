import { Draggable } from '@hello-pangea/dnd'

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

export default function TaskCard({ task, index }) {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
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
            cursor: 'grab',
            ...provided.draggableProps.style,
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
            {task.title}
          </p>
          {task.description && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
              {task.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: PRIORITY_COLORS[task.priority] || '#94a3b8',
            }}>
              {task.priority}
            </span>
            {task.due_date && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Due {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {task.assignee_email && (
              <span style={{
                fontSize: 11,
                background: '#f1f5f9',
                borderRadius: 12,
                padding: '2px 8px',
                color: '#475569',
                marginLeft: 'auto',
              }}>
                {task.assignee_email}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}