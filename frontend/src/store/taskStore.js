import { create } from 'zustand'
import { tasksApi } from '../api/tasks.api'

export const useTaskStore = create((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true })
    const { data } = await tasksApi.getAll()
    set({ tasks: data, loading: false })
  },

  createTask: async (payload) => {
    const { data } = await tasksApi.create(payload)
    set((s) => ({ tasks: [...s.tasks, data] }))
  },

  updateTask: async (id, payload) => {
    const { data } = await tasksApi.update(id, payload)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }))
  },

  deleteTask: async (id) => {
    await tasksApi.delete(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },
}))