import { useState } from 'react'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'

const ROLE_COLORS = {
  owner:  { bg: '#fef3c7', color: '#92400e' },
  admin:  { bg: '#ede9fe', color: '#5b21b6' },
  member: { bg: '#e0f2fe', color: '#0369a1' },
  viewer: { bg: '#f1f5f9', color: '#475569' },
}

export default function TeamSidebar() {
  const {
    teams, activeTeam, members, myRole,
    setActiveTeam, createTeam, inviteMember, changeRole, removeMember,
  } = useTeamStore()
  const { user } = useAuthStore()

  const [showNewTeam, setShowNewTeam]   = useState(false)
  const [showInvite, setShowInvite]     = useState(false)
  const [teamName, setTeamName]         = useState('')
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState('member')
  const [error, setError]               = useState('')

  const canManageMembers = ['owner', 'admin'].includes(myRole)
  const isOwner          = myRole === 'owner'

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!teamName.trim()) return
    try {
      await createTeam(teamName.trim())
      setTeamName('')
      setShowNewTeam(false)
      setError('')
    } catch {
      setError('Failed to create team')
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    try {
      await inviteMember(inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      setShowInvite(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite member')
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      await changeRole(userId, newRole)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change role')
    }
  }

  const handleRemove = async (userId, email) => {
    if (!confirm(`Remove ${email} from the team?`)) return
    try {
      await removeMember(userId)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member')
    }
  }

  return (
    <>
      <div style={{
        width: 240,
        background: '#1e293b',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px', borderBottom: '1px solid #334155' }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'white' }}>
            FlowTask
          </h1>
        </div>

        {/* Teams */}
        <div style={{ padding: '16px 12px 8px' }}>
          <p style={{ margin: '0 0 8px 4px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Teams
          </p>
          {teams.length === 0 && (
            <p style={{ fontSize: 12, color: '#475569', padding: '4px' }}>No teams yet</p>
          )}
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setActiveTeam(team)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: 6, border: 'none',
                background: activeTeam?.id === team.id ? '#3b82f6' : 'transparent',
                color: activeTeam?.id === team.id ? 'white' : '#94a3b8',
                cursor: 'pointer', fontSize: 13,
                fontWeight: activeTeam?.id === team.id ? 600 : 400,
                marginBottom: 2,
              }}
            >
              # {team.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewTeam(true)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 12px', borderRadius: 6,
              border: '1px dashed #334155', background: 'transparent',
              color: '#475569', cursor: 'pointer', fontSize: 12, marginTop: 8,
            }}
          >
            + New Team
          </button>
        </div>

        {/* Members */}
        {activeTeam && (
          <div style={{ padding: '16px 12px', borderTop: '1px solid #334155', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Members
              </p>
              {canManageMembers && (
                <button
                  onClick={() => setShowInvite(true)}
                  style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Invite
                </button>
              )}
            </div>

            {members.map((member) => {
              const roleStyle  = ROLE_COLORS[member.role] || ROLE_COLORS.member
              const isSelf     = member.id === user?.id
              const isOwnerRow = member.role === 'owner'

              return (
                <div key={member.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                    }}>
                      {member.email[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email} {isSelf && <span style={{ color: '#64748b' }}>(you)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Role badge + controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, paddingLeft: 34 }}>
                    {/* Owner can change roles of non-owners */}
                    {isOwner && !isSelf && !isOwnerRow ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        style={{
                          fontSize: 10, padding: '1px 4px',
                          borderRadius: 4, border: '1px solid #334155',
                          background: '#0f172a', color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                      </select>
                    ) : (
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: roleStyle.bg, color: roleStyle.color,
                        fontWeight: 600,
                      }}>
                        {member.role}
                      </span>
                    )}

                    {/* Remove button — admins/owners can remove non-owners */}
                    {canManageMembers && !isSelf && !isOwnerRow && (
                      <button
                        onClick={() => handleRemove(member.id, member.email)}
                        style={{
                          fontSize: 10, color: '#475569',
                          background: 'none', border: 'none',
                          cursor: 'pointer', marginLeft: 'auto',
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.target.style.color = '#475569'}
                      >
                        remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New team modal */}
      {showNewTeam && (
        <Modal onClose={() => { setShowNewTeam(false); setError('') }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Create Team</h2>
          <form onSubmit={handleCreateTeam}>
            <input
              autoFocus
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={inputStyle}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>}
            <ModalButtons onCancel={() => { setShowNewTeam(false); setError('') }} label="Create" />
          </form>
        </Modal>
      )}

      {/* Invite modal */}
      {showInvite && (
        <Modal onClose={() => { setShowInvite(false); setError('') }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
            Invite to {activeTeam?.name}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
            User must already have an account
          </p>
          <form onSubmit={handleInvite}>
            <input
              autoFocus
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={inputStyle}
            />
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', margin: '10px 0 4px' }}>
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={inputStyle}
            >
              <option value="viewer">Viewer — read only</option>
              <option value="member">Member — create & edit own tasks</option>
              <option value="admin">Admin — manage members & all tasks</option>
            </select>
            {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0' }}>{error}</p>}
            <ModalButtons onCancel={() => { setShowInvite(false); setError('') }} label="Send Invite" />
          </form>
        </Modal>
      )}
    </>
  )
}

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {children}
      </div>
    </div>
  )
}

function ModalButtons({ onCancel, label }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
      <button type="button" onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13 }}>
        Cancel
      </button>
      <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
        {label}
      </button>
    </div>
  )
}

const inputStyle = {
  display: 'block', width: '100%', padding: 10,
  borderRadius: 6, border: '1px solid #e2e8f0',
  fontSize: 14, boxSizing: 'border-box', marginBottom: 4,
}