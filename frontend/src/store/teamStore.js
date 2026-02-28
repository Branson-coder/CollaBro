import { create } from 'zustand'
import { teamsApi } from '../api/teams.api'

export const useTeamStore = create((set, get) => ({
  teams:      [],
  activeTeam: null,
  members:    [],
  myRole:     null,
  loading:    false,

  fetchTeams: async () => {
    set({ loading: true })
    const { data } = await teamsApi.getAll()
    set({ teams: data, loading: false })
    if (data.length > 0 && !get().activeTeam) {
      get().setActiveTeam(data[0])
    }
  },

setActiveTeam: async (team) => {
  const currentTeam = get().activeTeam
  const myRole = team.role || null

  if (currentTeam?.id === team.id) {
    set({ myRole })
    return
  }

  set({ activeTeam: team, members: [], myRole })
  const { data } = await teamsApi.getMembers(team.id)
  set({ members: data })
},

  createTeam: async (name) => {
    const { data } = await teamsApi.create(name)
    const teamWithRole = { ...data, role: 'owner' }
    set((s) => ({ teams: [...s.teams, teamWithRole] }))
    get().setActiveTeam(teamWithRole)
    return data
  },

  inviteMember: async (email, role = 'member') => {
    const { activeTeam } = get()
    if (!activeTeam) return
    await teamsApi.invite(activeTeam.id, email, role)
    const { data } = await teamsApi.getMembers(activeTeam.id)
    set({ members: data })
  },

  changeRole: async (userId, role) => {
    const { activeTeam } = get()
    if (!activeTeam) return
    await teamsApi.changeRole(activeTeam.id, userId, role)
    const { data } = await teamsApi.getMembers(activeTeam.id)
    set({ members: data })
  },

  removeMember: async (userId) => {
    const { activeTeam } = get()
    if (!activeTeam) return
    await teamsApi.removeMember(activeTeam.id, userId)
    set((s) => ({ members: s.members.filter((m) => m.id !== userId) }))
  },
}))