import { useState } from 'react'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'

const ROLE_COLORS = { owner: '#f59e0b', admin: '#8b5cf6', member: '#3b82f6', viewer: '#6b7280' }

export default function TeamSidebar() {
  const { teams, activeTeam, members, myRole, setActiveTeam, createTeam, inviteMember, changeRole, removeMember } = useTeamStore()
  const { user } = useAuthStore()

  const [showNewTeam, setShowNewTeam] = useState(false)
  const [showInvite, setShowInvite]   = useState(false)
  const [teamName, setTeamName]       = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('member')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const canManage = ['owner', 'admin'].includes(myRole)
  const isOwner   = myRole === 'owner'

  const withLoading = async (fn) => { setError(''); setLoading(true); try { await fn() } catch (err) { setError(err?.response?.data?.message || 'Something went wrong') } finally { setLoading(false) } }

  const handleCreateTeam = (e) => { e.preventDefault(); if (!teamName.trim()) return; withLoading(async () => { await createTeam(teamName.trim()); setTeamName(''); setShowNewTeam(false) }) }
  const handleInvite     = (e) => { e.preventDefault(); if (!inviteEmail.trim()) return; withLoading(async () => { await inviteMember(inviteEmail.trim(), inviteRole); setInviteEmail(''); setInviteRole('member'); setShowInvite(false) }) }

  const closeNewTeam = () => { setShowNewTeam(false); setTeamName(''); setError('') }
  const closeInvite  = () => { setShowInvite(false); setInviteEmail(''); setInviteRole('member'); setError('') }

  return (
    <>
      <aside style={{ width: 216, minHeight: '100vh', height: '100vh', background: 'var(--dark-3)', borderRight: '1px solid var(--dark-2)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 20, fontFamily: 'var(--sans)', overflow: 'hidden' }}>

        {/* Logo */}
        <div style={{ height: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--dark-2)', flexShrink: 0 }}>
          <div style={{ width: 22, height: 22, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, color: 'var(--dark)' }}>CB</div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, color: 'var(--cream)', letterSpacing: '0.02em' }}>CollaBro</span>
        </div>

        {/* Teams */}
        <div style={{ padding: '12px 8px 8px', flexShrink: 0 }}>
          <span className="sb-section-label">Teams</span>
          {teams.length === 0 && <p style={{ padding: '6px 8px', fontSize: 11, color: 'var(--muted-3)', fontStyle: 'italic' }}>No teams yet</p>}
          {teams.map((team) => (
            <button key={team.id} onClick={() => setActiveTeam(team)} className={`sb-team-btn ${activeTeam?.id === team.id ? 'active' : ''}`}>
              <span className="sb-team-hash">#</span>
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{team.name}</span>
            </button>
          ))}
          <button className="sb-new-team-btn" onClick={() => setShowNewTeam(true)}>+ new team</button>
        </div>

        {/* Members */}
        {activeTeam && (
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--dark-2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, maxHeight: '50vh' }}>
            <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span className="sb-section-label" style={{ marginBottom: 0 }}>Members</span>
              {canManage && <button className="sb-invite-btn" onClick={() => setShowInvite(true)}>+ invite</button>}
            </div>
            <div className="sb-member-list">
              {members.map((m) => {
                const roleColor = ROLE_COLORS[m.role] || ROLE_COLORS.member
                const isSelf    = m.id === user?.id
                const isOwnerRow = m.role === 'owner'
                return (
                  <div key={m.id} className="sb-member-row">
                    <div className="sb-member-avatar">{m.email[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-1)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block' }}>
                        {m.email.split('@')[0]}
                        {isSelf && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted-3)', marginLeft: 4 }}>you</span>}
                      </span>
                    </div>
                    {isOwner && !isSelf && !isOwnerRow ? (
                      <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} className="sb-role-select">
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                      </select>
                    ) : (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: roleColor, background: `${roleColor}18`, flexShrink: 0 }}>{m.role}</span>
                    )}
                    {canManage && !isSelf && !isOwnerRow && (
                      <button className="sb-remove-btn" onClick={() => confirm(`Remove ${m.email}?`) && removeMember(m.id)} title="Remove">×</button>
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
          <div className="modal-box sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-header-title">New Team</span>
              <button className="modal-close" onClick={closeNewTeam}>×</button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Team Name</label>
                  <input autoFocus placeholder="e.g. Design, Backend…" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="field-input" />
                </div>
                {error && <p className="error-msg">{error}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeNewTeam}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={closeInvite}>
          <div className="modal-box sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-header-title">Invite to {activeTeam?.name}</span>
              <button className="modal-close" onClick={closeInvite}>×</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input autoFocus type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="field-input" />
                </div>
                <div className="field-group">
                  <label className="field-label">Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="field-select">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                {error && <p className="error-msg">{error}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeInvite}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Inviting…' : 'Send Invite'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}