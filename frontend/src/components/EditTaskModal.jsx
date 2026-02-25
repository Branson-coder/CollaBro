import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'

export default function EditTaskModal({ task, onClose }) {
  const updateTask = useTaskStore((s) => s.updateTask)
  const [form, setForm] = useState({
    title:       task.title       || '',
    description: task.description || '',
    priority:    task.priority    || 'medium',
    due_date:    task.due_date
      ? new Date(task.due_date).toISOString().split('T')[0]
      : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required')
    setLoading(true)
    try {
      await updateTask(task.id, {
        ...form,
        due_date: form.due_date || null,
      })
      onClose()
    } catch {
      setError('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 12,
          padding: 28, width: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>
          Edit Task
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Title</label>
          <input
            autoFocus
            value={form.title}
            onChange={set('title')}
            style={inputStyle}
          />

          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <label style={labelStyle}>Priority</label>
          <select value={form.priority} onChange={set('priority')} style={inputStyle}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <label style={labelStyle}>Due Date</label>
          <input
            type="date"
            value={form.due_date}
            onChange={set('due_date')}
            style={inputStyle}
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 12px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 6,
                border: '1px solid #e2e8f0', background: 'white',
                cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 18px', borderRadius: 6,
                border: 'none', background: '#3b82f6',
                color: 'white', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
  marginTop: 14,
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: 10,
  borderRadius: 6,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  boxSizing: 'border-box',
  color: '#1e293b',
}