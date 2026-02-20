import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'


export default function TasksPage() {
  const { tasks, loading, fetchTasks, createTask, deleteTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => { fetchTasks() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({ title, description })
    setTitle('')
    setDescription('')
  }

  const handleLogout = () => {
  logout()
  navigate('/login')
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
        <button onClick={handleLogout} style={{ float: 'right', padding: '6px 14px' }}>
         Logout
    </button>
      <h2>My Tasks</h2>

      <form onSubmit={handleCreate} style={{ marginBottom: 32 }}>
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }}
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }}
        />
        <button type="submit" style={{ padding: '8px 20px' }}>
          Add Task
        </button>
      </form>

      {tasks.length === 0 ? (
        <p style={{ color: '#888' }}>No tasks yet — add one above.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((task) => (
            <li key={task.id} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '12px 0',
              borderBottom: '1px solid #eee'
            }}>
              <div>
                <strong>{task.title}</strong>
                {task.description && (
                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
                    {task.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}