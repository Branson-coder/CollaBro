import axiosClient from './axiosClient'

export const tasksApi = {
  getAll:  (teamId)       => axiosClient.get('/tasks', { params: teamId ? { teamId } : {} }),
  create:  (data)         => axiosClient.post('/tasks', data),
  update:  (id, data)     => axiosClient.put(`/tasks/${id}`, data),
  delete:  (id)           => axiosClient.delete(`/tasks/${id}`),
  assign:  (id)           => axiosClient.post(`/tasks/${id}/assign`),
}