import { useEffect, useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import { useTeamStore } from '../store/teamStore'
import { useSocket } from '../hooks/useSocket'
import Column from '../components/Column'
import TeamSidebar from '../components/TeamSidebar'
import ActivityFeed from '../components/ActivityFeed'
import { Plus, LogOut, Activity, Hash, UserCircle, Loader2, X } from 'lucide-react'

const STATUSES = ['todo', 'in_progress', 'review', 'done']

export default function Board() {
  const { tasks, fetchTasks, updateTask, createTask, clearTasks } = useTaskStore()
  const { logout, user } = useAuthStore()
  const { activeTeam, fetchTeams } = useTeamStore()
  const navigate = useNavigate()

  const teamId = activeTeam?.id || null
  useSocket(teamId)

  const [newTask, setNewTask]   = useState({ title: '', description: '', priority: 'medium' })
  const [showForm, setShowForm] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  useEffect(() => { fetchTeams() }, [])

  useEffect(() => {
    if (teamId !== undefined) {
      fetchTasks(teamId)
    }
  }, [teamId, fetchTasks])

  const columns = STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {})

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const taskId    = parseInt(draggableId)
    const newStatus = destination.droppableId
    const task      = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Optimistic update
    useTaskStore.setState((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, position: destination.index }
          : t
      ),
    }))

    await updateTask(taskId, {
      status:   newStatus,
      position: destination.index,
      team_id:  task.team_id,
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    await createTask({ ...newTask, team_id: teamId })
    setNewTask({ title: '', description: '', priority: 'medium' })
    setShowForm(false)
  }

  const handleLogout = () => {
    clearTasks()
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Team Sidebar */}
      <TeamSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Hash size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {activeTeam ? activeTeam.name : 'My Personal Space'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <UserCircle size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">{user?.email}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            <button
              onClick={() => setActivityOpen((o) => !o)}
              className={`p-2 rounded-xl border transition-all ${
                activityOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <Activity size={20} />
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-100"
            >
              <Plus size={18} />
              <span>New Task</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Board Area */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden p-8">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full min-w-max items-start">
              {STATUSES.map((status) => (
                <Column 
                  key={status} 
                  status={status} 
                  tasks={columns[status]} 
                  className="w-80 flex-shrink-0"
                />
              ))}
            </div>
          </DragDropContext>
        </main>
      </div>

      {/* Activity Sidebar overlay logic handled by the component */}
      <ActivityFeed
        isOpen={activityOpen}
        onClose={() => setActivityOpen(false)}
      />

      {/* New Task Modal */}
      {showForm && (
        <div 
          onClick={() => setShowForm(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800">Create Task</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  autoFocus
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700 placeholder-slate-400"
                />
                <textarea
                  placeholder="Add details (optional)..."
                  value={newTask.description}
                  onChange={(e) => setNewTask((s) => ({ ...s, description: e.target.value }))}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700 placeholder-slate-400 h-24 resize-none"
                />
                <div className="relative">
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask((s) => ({ ...s, priority: e.target.value }))}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700 appearance-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 pb-8">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}