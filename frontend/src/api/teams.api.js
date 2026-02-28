import axiosClient from './axiosClient'

export const teamsApi = {
  getAll:       ()                      => axiosClient.get('/teams'),
  create:       (name)                  => axiosClient.post('/teams', { name }),
  getMembers:   (teamId)                => axiosClient.get(`/teams/${teamId}`),
  invite:       (teamId, email, role)   => axiosClient.post(`/teams/${teamId}/invite`, { email, role }),
  changeRole:   (teamId, userId, role)  => axiosClient.patch(`/teams/${teamId}/members/${userId}/role`, { role }),
  removeMember: (teamId, userId)        => axiosClient.delete(`/teams/${teamId}/members/${userId}`),
}