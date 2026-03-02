import { create } from 'zustand'
import { tasksApi } from '../api/tasks.api'

export const useTaskStore = create((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (teamId) => {
    set({ loading: true })
    const { data } = await tasksApi.getAll(teamId)
    set({ tasks: data, loading: false })
  },

  createTask: async (payload) => {
    const { data } = await tasksApi.create(payload)
    set((s) => {
      const exists = s.tasks.find((t) => t.id === data.id)
      if (exists) return s
      return { tasks: [...s.tasks, data] }
    })
    return data
  },

  updateTask: async (id, payload) => {
    const { data } = await tasksApi.update(id, payload)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }))
  },

  toggleAssign: async (id) => {
    const { data } = await tasksApi.assign(id)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }))
    return data
  },

  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    try {
      await tasksApi.delete(id)
    } catch (err) {
      console.error('Delete failed', err)
    }
  },

  clearTasks: () => set({ tasks: [], loading: false }),

  applyRemoteCreate: (task) => {
    set((s) => {
      const exists = s.tasks.find((t) => t.id === task.id)
      if (exists) return s
      return { tasks: [...s.tasks, task] }
    })
  },

  applyRemoteUpdate: (task) => {
    set((s) => {
      const existing = s.tasks.find((t) => t.id === task.id)
      if (existing && existing.updated_at === task.updated_at) return s
      return { tasks: s.tasks.map((t) => (t.id === task.id ? task : t)) }
    })
  },

  applyRemoteDelete: (taskId) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== Number(taskId)),
    }))
  },
}))