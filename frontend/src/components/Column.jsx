import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const COLUMN_STYLES = {
  todo:        { label: 'To Do',       color: '#94a3b8', bg: '#f8fafc' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: '#eff6ff' },
  review:      { label: 'Review',      color: '#a855f7', bg: '#faf5ff' },
  done:        { label: 'Done',        color: '#22c55e', bg: '#f0fdf4' },
}

export default function Column({ status, tasks }) {
  const style = COLUMN_STYLES[status] || { label: status, color: '#94a3b8', bg: '#f8fafc' }

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        padding: '0 4px',
      }}>
        <span style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: style.color,
          flexShrink: 0,
        }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
          {style.label}
        </span>
        <span style={{
          marginLeft: 'auto',
          background: '#e2e8f0',
          borderRadius: 12,
          padding: '1px 8px',
          fontSize: 12,
          color: '#64748b',
          fontWeight: 600,
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              background: snapshot.isDraggingOver ? style.bg : 'transparent',
              borderRadius: 10,
              padding: 8,
              minHeight: 200,
              border: snapshot.isDraggingOver
                ? `2px dashed ${style.color}`
                : '2px dashed transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}