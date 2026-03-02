import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const COLUMN_CONFIG = {
  todo:        { label: 'To Do',       accent: '#6b7280' },
  in_progress: { label: 'In Progress', accent: '#3b82f6' },
  review:      { label: 'Review',      accent: '#f59e0b' },
  done:        { label: 'Done',        accent: '#22c55e' },
}

export default function Column({ status, tasks }) {
  const config = COLUMN_CONFIG[status] || COLUMN_CONFIG.todo

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .column-root {
          width: 272px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #f5f4f0;
        }

        .column-header {
          height: 36px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #eceae5;
          border-bottom: 1px solid #d6d3cc;
        }

        .column-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .column-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          color: #4b5563;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex: 1;
        }

        .column-count {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #9ca3af;
        }

        .column-drop {
          flex: 1;
          min-height: 480px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          transition: background 0.15s;
        }

        .column-drop.dragging-over {
          background: #eceae5;
          outline: 2px dashed #d6d3cc;
          outline-offset: -4px;
        }
      `}</style>

      <div className="column-root">
        <div className="column-header">
          <span
            className="column-pip"
            style={{ background: config.accent }}
          />
          <span className="column-label">{config.label}</span>
          <span className="column-count">{tasks.length}</span>
        </div>

        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`column-drop ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            >
              {tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </>
  )
}