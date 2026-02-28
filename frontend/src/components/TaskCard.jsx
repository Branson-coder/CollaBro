import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { useTaskStore } from '../store/taskStore'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'
import EditTaskModal from './EditTaskModal'
import { Calendar, Trash2, GripVertical, AlertCircle, Clock } from 'lucide-react'

const PRIORITY_THEMES = {
  critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500' },
  high:     { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500' },
  medium:   { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' },
  low:      { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
}

export default function TaskCard({ task, index }) {
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const myRole     = useTeamStore((s) => s.myRole)
  const { user }   = useAuthStore()
  const [editing, setEditing] = useState(false)

  // --- Original Logic Restored ---
  const isViewer = myRole === 'viewer'
  const isOwnerOrAdmin = ['owner', 'admin'].includes(myRole)
  const isMyTask = task.user_id === user?.id
  const canEdit = !isViewer && (isOwnerOrAdmin || isMyTask)
  const canDelete = !isViewer && (isOwnerOrAdmin || isMyTask)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm(`Delete "${task.title}"?`)) return
    await deleteTask(task.id)
  }

  const handleClick = () => {
    if (canEdit) setEditing(true)
  }

  const now = new Date()
  const due = task.due_date ? new Date(task.due_date) : null
  const isOverdue = due && due < now && task.status !== 'done'
  const isDueToday = due && due.toDateString() === now.toDateString()
  
  const p = PRIORITY_THEMES[task.priority] || PRIORITY_THEMES.low

  return (
    <>
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
            onClick={handleClick}
            className={`
              group relative mb-3 rounded-2xl border bg-white/90 backdrop-blur-md
              transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${snapshot.isDragging 
                ? 'shadow-2xl ring-2 ring-indigo-500/30 rotate-[1.5deg] scale-[1.05] z-50 !cursor-grabbing' 
                : 'shadow-sm hover:shadow-xl hover:-translate-y-1 border-slate-200 hover:border-indigo-300'}
              ${isViewer ? 'opacity-80 cursor-default' : 'cursor-grab active:cursor-grabbing'}
            `}
            style={{
              ...provided.draggableProps.style,
            }}
          >
            {/* Top Bar: Priority & Actions */}
            <div className="flex items-center justify-between p-3 pb-1">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-sm ${p.bg} ${p.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${p.color}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Main Content */}
            <div className="p-4 pt-2">
              <h4 className="text-[15px] font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                {task.title}
              </h4>
              
              {task.description && (
                <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium opacity-80">
                  {task.description}
                </p>
              )}

              {/* Footer: Date & Assignee */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="flex items-center gap-3">
                  {due && (
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md 
                      ${isOverdue ? 'bg-red-100 text-red-700' : isDueToday ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                      {isOverdue ? <AlertCircle size={12} /> : isDueToday ? <Clock size={12} /> : <Calendar size={12} />}
                      {isOverdue ? 'Overdue' : isDueToday ? 'Today' : due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>

                {task.assignee_email && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:block truncate max-w-[80px]">
                      {task.assignee_email.split('@')[0]}
                    </span>
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-black shadow-md ring-2 ring-white">
                      {task.assignee_email[0].toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
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