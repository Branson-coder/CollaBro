import { useEffect, useState, useRef } from 'react'
import { activityApi } from '../api/activity.api'
import { useTeamStore } from '../store/teamStore'

const ACTION_STYLES = {
  created: { color: '#22c55e', symbol: '＋' },
  updated: { color: '#3b82f6', symbol: '✎' },
  deleted: { color: '#ef4444', symbol: '✕' },
}

function timeAgo(dateStr) {
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
  const diff  = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}

export default function ActivityFeed({ isOpen, onClose }) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(false)
  const activeTeam            = useTeamStore((s) => s.activeTeam)
  const intervalRef           = useRef(null)

  const fetchLogs = async () => {
    if (!activeTeam) return
    try {
      const { data } = await activityApi.getTeamActivity(activeTeam.id)
      setLogs(data)
    } catch (err) {
      console.error('Failed to fetch activity', err)
    }
  }

  useEffect(() => {
    if (!isOpen || !activeTeam) return
    setLoading(true)
    fetchLogs().finally(() => setLoading(false))

    // Poll every 10 seconds while panel is open
    intervalRef.current = setInterval(fetchLogs, 10000)
    return () => clearInterval(intervalRef.current)
  }, [isOpen, activeTeam])

  if (!isOpen) return null

  return (
    <div style={{
      width: 300,
      background: 'white',
      borderLeft: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '0 16px',
        height: 56,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
          Activity
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}
        >
          ×
        </button>
      </div>

      {/* Logs */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 16 }}>
            Loading...
          </p>
        ) : logs.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 16 }}>
            No activity yet
          </p>
        ) : (
          logs.map((log) => {
            console.log('raw timestamp:', log.created_at)
            const style = ACTION_STYLES[log.action] || ACTION_STYLES.updated
            return (
              <div key={log.id} style={{
                padding: '10px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                {/* Action icon */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: `${style.color}15`,
                  color: style.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
                }}>
                  {style.symbol}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#1e293b', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>
                      {log.username || log.user_email?.split('@')[0]}
                    </span>
                    {' '}
                    {log.details}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>
                    {timeAgo(log.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}