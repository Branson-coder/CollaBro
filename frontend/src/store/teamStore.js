import { create } from 'zustand'
import { teamsApi } from '../api/teams.api'

export const useTeamStore = create((set, get) => ({
  teams:         [],
  activeTeam:    null,
  members:       [],
  loading:       false,

  fetchTeams: async () => {
    set({ loading: true })
    const { data } = await teamsApi.getAll()
    set({ teams: data, loading: false })

    // Auto-select first team if none active
    if (data.length > 0 && !get().activeTeam) {
      get().setActiveTeam(data[0])
    }
  },

  setActiveTeam: async (team) => {
    set({ activeTeam: team, members: [] })
    const { data } = await teamsApi.getMembers(team.id)
    set({ members: data })
  },

  createTeam: async (name) => {
    const { data } = await teamsApi.create(name)
    set((s) => ({ teams: [...s.teams, data] }))
    get().setActiveTeam(data)
    return data
  },

  inviteMember: async (email) => {
    const { activeTeam } = get()
    if (!activeTeam) return
    await teamsApi.invite(activeTeam.id, email)
    // Refresh members list
    const { data } = await teamsApi.getMembers(activeTeam.id)
    set({ members: data })
  },
}))