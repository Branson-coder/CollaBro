import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const COLUMN_CONFIG = {
  todo:        { label: 'To Do',       accent: '#6b7280' },
  in_progress: { label: 'In Progress', accent: '#3b82f6' },
  review:      { label: 'Review',      accent: '#f59e0b' },
  done:        { label: 'Done',        accent: '#22c55e' },
}

export default function Column({ status, tasks }) {
  const { label, accent } = COLUMN_CONFIG[status] || COLUMN_CONFIG.todo

  return (
    <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ height: 36, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--border-2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, color: 'var(--muted-3)', letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted-1)' }}>{tasks.length}</span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1, minHeight: 480, padding: 8,
              display: 'flex', flexDirection: 'column', gap: 1,
              background: snapshot.isDraggingOver ? 'var(--border-2)' : 'var(--bg)',
              outline: snapshot.isDraggingOver ? '2px dashed var(--border)' : 'none',
              outlineOffset: -4,
              transition: 'background 0.15s',
            }}
          >
            {tasks.map((task, index) => <TaskCard key={task.id} task={task} index={index} />)}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}