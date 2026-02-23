import axiosClient from './axiosClient'

export const teamsApi = {
  getAll:   ()                => axiosClient.get('/teams'),
  create:   (name)            => axiosClient.post('/teams', { name }),
  getMembers: (teamId)        => axiosClient.get(`/teams/${teamId}`),
  invite:   (teamId, email)   => axiosClient.post(`/teams/${teamId}/invite`, { email }),
}