import axiosClient from './axiosClient'

export const activityApi = {
  getTeamActivity: (teamId) => axiosClient.get(`/activity/${teamId}`),
}