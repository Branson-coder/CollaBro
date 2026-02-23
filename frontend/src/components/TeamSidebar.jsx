import { useState } from 'react'
import { useTeamStore } from '../store/teamStore'

export default function TeamSidebar() {
  const { teams, activeTeam, members, setActiveTeam, createTeam, inviteMember } = useTeamStore()
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [showInvite, setShowInvite]   = useState(false)
  const [teamName, setTeamName]       = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [error, setError]             = useState('')

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
      await inviteMember(inviteEmail.trim())
      setInviteEmail('')
      setShowInvite(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite member')
    }
  }

  return (
    <>
      <div style={{
        width: 220,
        background: '#1e293b',
        minHeight: '100vh',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #334155' }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'white' }}>
            FlowTask
          </h1>
        </div>

        {/* Teams list */}
        <div style={{ padding: '16px 12px 8px' }}>
          <p style={{ margin: '0 0 8px 4px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Teams
          </p>

          {teams.length === 0 && (
            <p style={{ fontSize: 12, color: '#475569', padding: '4px' }}>
              No teams yet
            </p>
          )}

          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setActiveTeam(team)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeTeam?.id === team.id ? '#3b82f6' : 'transparent',
                color: activeTeam?.id === team.id ? 'white' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 13,
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
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px dashed #334155',
              background: 'transparent',
              color: '#475569',
              cursor: 'pointer',
              fontSize: 12,
              marginTop: 8,
            }}
          >
            + New Team
          </button>
        </div>

        {/* Active team members */}
        {activeTeam && (
          <div style={{ padding: '16px 12px', borderTop: '1px solid #334155', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Members
              </p>
              <button
                onClick={() => setShowInvite(true)}
                style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                + Invite
              </button>
            </div>

            {members.map((member) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {member.email[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                    {member.email}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: '#475569', textTransform: 'capitalize' }}>
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
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
            {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0' }}>{error}</p>}
            <ModalButtons onCancel={() => { setShowNewTeam(false); setError('') }} label="Create" />
          </form>
        </Modal>
      )}

      {/* Invite modal */}
      {showInvite && (
        <Modal onClose={() => { setShowInvite(false); setError('') }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Invite to {activeTeam?.name}</h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>User must already have an account</p>
          <form onSubmit={handleInvite}>
            <input
              autoFocus
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={inputStyle}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0' }}>{error}</p>}
            <ModalButtons onCancel={() => { setShowInvite(false); setError('') }} label="Send Invite" />
          </form>
        </Modal>
      )}
    </>
  )
}

// Shared modal wrapper
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 12,
          padding: 28, width: 380,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ModalButtons({ onCancel, label }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
      <button
        type="button"
        onClick={onCancel}
        style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13 }}
      >
        Cancel
      </button>
      <button
        type="submit"
        style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
      >
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