import axiosClient from './axiosClient';
export const tasksApi = {
  getAll:  ()           => axiosClient.get('/tasks'),
  create:  (data)       => axiosClient.post('/tasks', data),
  update:  (id, data)   => axiosClient.put(`/tasks/${id}`, data),
  delete:  (id)         => axiosClient.delete(`/tasks/${id}`),
};