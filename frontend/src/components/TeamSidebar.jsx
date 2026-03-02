import { useState } from 'react'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'

const ROLE_COLORS = {
  owner:  '#f59e0b',
  admin:  '#8b5cf6',
  member: '#3b82f6',
  viewer: '#6b7280',
}

export default function TeamSidebar() {
  const {
    teams, activeTeam, members, myRole,
    setActiveTeam, createTeam, inviteMember, changeRole, removeMember,
  } = useTeamStore()
  const { user } = useAuthStore()

  const [showNewTeam, setShowNewTeam] = useState(false)
  const [showInvite, setShowInvite]   = useState(false)
  const [teamName, setTeamName]       = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('member')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const canManageMembers = ['owner', 'admin'].includes(myRole)
  const isOwner          = myRole === 'owner'

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!teamName.trim()) return
    setError('')
    setLoading(true)
    try {
      await createTeam(teamName.trim())
      setTeamName('')
      setShowNewTeam(false)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  // Store signature: inviteMember(email, role) — activeTeam is resolved inside the store
  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setError('')
    setLoading(true)
    try {
      await inviteMember(inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      setInviteRole('member')
      setShowInvite(false)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  // Store signature: changeRole(userId, role)
  const handleChangeRole = async (userId, newRole) => {
    try {
      await changeRole(userId, newRole)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to change role')
    }
  }

  // Store signature: removeMember(userId)
  const handleRemove = async (memberId, email) => {
    if (!confirm(`Remove ${email} from the team?`)) return
    try {
      await removeMember(memberId)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to remove member')
    }
  }

  const closeNewTeam = () => { setShowNewTeam(false); setTeamName(''); setError('') }
  const closeInvite  = () => { setShowInvite(false); setInviteEmail(''); setInviteRole('member'); setError('') }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .sidebar {
          width: 216px;
          min-height: 100vh;
          height: 100vh;
          background: #141414;
          border-right: 1px solid #2e2e2e;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          z-index: 20;
          font-family: 'IBM Plex Sans', sans-serif;
          overflow: hidden;
        }

        /* Logo */
        .sb-logo {
          height: 52px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #2e2e2e;
          flex-shrink: 0;
        }

        .sb-logo-mark {
          width: 22px; height: 22px;
          background: #e8e4d9;
          display: flex; align-items: center; justify-content: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: #1a1a1a; flex-shrink: 0;
        }

        .sb-logo-name {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px; font-weight: 500;
          color: #e8e4d9; letter-spacing: 0.02em;
        }

        /* Teams nav */
        .sb-teams {
          padding: 12px 8px 8px;
          flex-shrink: 0;
        }

        .sb-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px; font-weight: 500;
          color: #4b5563; letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0 6px;
          margin-bottom: 4px;
          display: block;
        }

        .sb-team-btn {
          width: 100%;
          display: flex; align-items: center;
          padding: 6px 8px;
          background: transparent;
          border: none; cursor: pointer;
          text-align: left;
          color: #6b7280;
          font-size: 12px; font-weight: 500;
          font-family: 'IBM Plex Sans', sans-serif;
          gap: 6px;
          transition: background 0.1s, color 0.1s;
        }

        .sb-team-btn:hover { background: #1f1f1f; color: #d1cfc9; }
        .sb-team-btn.active { background: #2e2e2e; color: #e8e4d9; }

        .sb-team-hash {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; color: #3b3b3b;
          flex-shrink: 0; transition: color 0.1s;
        }
        .sb-team-btn:hover .sb-team-hash,
        .sb-team-btn.active .sb-team-hash { color: #6b7280; }

        .sb-team-name {
          overflow: hidden; white-space: nowrap;
          text-overflow: ellipsis; flex: 1;
        }

        .sb-new-team-btn {
          width: 100%;
          display: flex; align-items: center; gap: 6px;
          padding: 6px 8px; margin-top: 4px;
          background: transparent;
          border: 1px dashed #2e2e2e;
          cursor: pointer;
          color: #4b5563;
          font-size: 11px;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.02em;
          transition: border-color 0.15s, color 0.15s;
        }
        .sb-new-team-btn:hover { border-color: #6b7280; color: #9ca3af; }

        /* Members section */
        .sb-members {
          margin-top: auto;
          border-top: 1px solid #2e2e2e;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
          max-height: 50vh;
        }

        .sb-members-header {
          padding: 10px 14px 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .sb-invite-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px; font-weight: 500;
          color: #6b7280; letter-spacing: 0.04em;
          background: none; border: none; cursor: pointer;
          transition: color 0.15s; padding: 0;
        }
        .sb-invite-btn:hover { color: #e8e4d9; }

        .sb-member-list {
          overflow-y: auto;
          padding: 0 8px 12px;
        }

        .sb-member-list::-webkit-scrollbar { width: 3px; }
        .sb-member-list::-webkit-scrollbar-track { background: transparent; }
        .sb-member-list::-webkit-scrollbar-thumb { background: #2e2e2e; }

        .sb-member-row {
          padding: 6px 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .sb-member-avatar {
          width: 22px; height: 22px;
          background: #2e2e2e;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px; font-weight: 500;
          color: #9ca3af; flex-shrink: 0;
        }

        .sb-member-info { flex: 1; min-width: 0; }

        .sb-member-name {
          font-size: 11px; font-weight: 500;
          color: #9ca3af;
          overflow: hidden; white-space: nowrap;
          text-overflow: ellipsis;
          display: block;
        }

        .sb-member-name .you {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px; color: #4b5563; margin-left: 4px;
        }

        .sb-role-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px; font-weight: 500;
          padding: 1px 5px;
          text-transform: uppercase; letter-spacing: 0.04em;
          flex-shrink: 0;
        }

        .sb-role-select {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          background: #1a1a1a;
          color: #9ca3af;
          border: 1px solid #2e2e2e;
          padding: 2px 4px;
          outline: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .sb-role-select:focus { border-color: #6b7280; }

        .sb-remove-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          background: none; border: none;
          color: transparent;
          cursor: pointer;
          padding: 0 2px;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .sb-member-row:hover .sb-remove-btn { color: #4b5563; }
        .sb-remove-btn:hover { color: #ef4444 !important; }

        /* ---- Modals ---- */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(26,26,26,0.7);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .modal-box {
          width: 100%; max-width: 380px;
          background: #f5f4f0;
          border: 1px solid #d6d3cc;
        }

        .modal-head {
          height: 44px; padding: 0 20px;
          background: #1a1a1a;
          display: flex; align-items: center; justify-content: space-between;
        }

        .modal-head-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: #e8e4d9; letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .modal-close {
          background: none; border: none;
          color: #4b5563; cursor: pointer;
          font-size: 18px; line-height: 1; padding: 0;
          transition: color 0.15s;
        }
        .modal-close:hover { color: #e8e4d9; }

        .modal-body { padding: 20px; }

        .field-group { margin-bottom: 14px; }
        .field-group:last-of-type { margin-bottom: 0; }

        .field-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 500;
          color: #9ca3af; letter-spacing: 0.06em;
          text-transform: uppercase; margin-bottom: 5px;
        }

        .field-input, .field-select {
          width: 100%; padding: 9px 11px;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1a1a1a; background: #ffffff;
          border: 1px solid #d6d3cc; outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .field-input:focus, .field-select:focus { border-color: #1a1a1a; }

        .field-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          cursor: pointer;
        }

        .modal-error {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; color: #ef4444;
          margin: 10px 0 0; padding: 0;
        }

        .modal-footer {
          padding: 12px 20px;
          background: #eceae5;
          border-top: 1px solid #d6d3cc;
          display: flex; justify-content: flex-end; gap: 8px;
        }

        .btn-cancel {
          padding: 7px 16px;
          font-size: 12px; font-weight: 500;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #6b7280; background: transparent;
          border: 1px solid #d6d3cc; cursor: pointer;
          transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #1a1a1a; color: #1a1a1a; }

        .btn-submit {
          padding: 7px 20px;
          font-size: 12px; font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #e8e4d9; background: #1a1a1a;
          border: 1px solid #1a1a1a; cursor: pointer;
          transition: background 0.15s;
        }
        .btn-submit:hover { background: #2e2e2e; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <aside className="sidebar">

        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-mark">F</div>
          <span className="sb-logo-name">FlowTask</span>
        </div>

        {/* Teams */}
        <div className="sb-teams">
          <span className="sb-section-label">Teams</span>

          {teams.length === 0 && (
            <p style={{ padding: '6px 8px', fontSize: 11, color: '#4b5563', fontStyle: 'italic' }}>
              No teams yet
            </p>
          )}

          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setActiveTeam(team)}
              className={`sb-team-btn ${activeTeam?.id === team.id ? 'active' : ''}`}
            >
              <span className="sb-team-hash">#</span>
              <span className="sb-team-name">{team.name}</span>
            </button>
          ))}

          <button className="sb-new-team-btn" onClick={() => setShowNewTeam(true)}>
            + new team
          </button>
        </div>

        {/* Members */}
        {activeTeam && (
          <div className="sb-members">
            <div className="sb-members-header">
              <span className="sb-section-label" style={{ marginBottom: 0 }}>Members</span>
              {canManageMembers && (
                <button className="sb-invite-btn" onClick={() => setShowInvite(true)}>
                  + invite
                </button>
              )}
            </div>

            <div className="sb-member-list">
              {members.map((member) => {
                const roleColor = ROLE_COLORS[member.role] || ROLE_COLORS.member
                const isSelf    = member.id === user?.id
                const isOwnerRow = member.role === 'owner'

                return (
                  <div key={member.id} className="sb-member-row">
                    <div className="sb-member-avatar">
                      {member.email[0].toUpperCase()}
                    </div>

                    <div className="sb-member-info">
                      <span className="sb-member-name">
                        {member.email.split('@')[0]}
                        {isSelf && <span className="you">you</span>}
                      </span>
                    </div>

                    {isOwner && !isSelf && !isOwnerRow ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="sb-role-select"
                      >
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                      </select>
                    ) : (
                      <span
                        className="sb-role-badge"
                        style={{ color: roleColor, background: `${roleColor}18` }}
                      >
                        {member.role}
                      </span>
                    )}

                    {canManageMembers && !isSelf && !isOwnerRow && (
                      <button
                        className="sb-remove-btn"
                        onClick={() => handleRemove(member.id, member.email)}
                        title="Remove member"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* New Team Modal */}
      {showNewTeam && (
        <div className="modal-overlay" onClick={closeNewTeam}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-head-title">New Team</span>
              <button className="modal-close" onClick={closeNewTeam}>×</button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Team Name</label>
                  <input
                    autoFocus
                    placeholder="e.g. Design, Backend…"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="field-input"
                  />
                </div>
                {error && <p className="modal-error">{error}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeNewTeam}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={closeInvite}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-head-title">Invite to {activeTeam?.name}</span>
              <button className="modal-close" onClick={closeInvite}>×</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input
                    autoFocus
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="field-select"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                {error && <p className="modal-error">{error}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeInvite}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Inviting…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}