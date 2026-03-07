import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AuthPage() {
  const [mode, setMode]         = useState('login')
  const [login, setLogin]       = useState('')
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const { login: doLogin, register } = useAuthStore()
  const navigate = useNavigate()

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setLogin('')
    setEmail('')
    setUsername('')
    setPassword('')
    setConfirm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (password !== confirm) return setError('Passwords do not match')
      if (password.length < 6)  return setError('Password must be at least 6 characters')
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return setError('Username must be 3–30 characters, letters, numbers, and underscores only')
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await doLogin({ login, password })
      } else {
        await register({ email, username, password })
      }
      navigate('/board')
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message
      setError(msg || (mode === 'login' ? 'Invalid credentials' : 'Could not create account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">

      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark">CB</div>
          <span className="auth-logo-name">CollaBro</span>
        </div>
        <div className="auth-tagline">
          <h1>Task management<br />that stays<br />out of the way.</h1>
          <p>Collaborate with your team, track progress, and ship faster.</p>
        </div>
        <div className="auth-features">
          {['Kanban board with real-time sync', 'Team roles and permissions', 'File attachments and due dates', 'Activity feed and notifications'].map((f) => (
            <div key={f} className="auth-feature">
              <div className="auth-feature-dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-form-title">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="auth-form-sub">
            {mode === 'login' ? 'Sign in to your workspace' : 'Get started for free'}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="auth-fields">

              {mode === 'login' ? (
                /* ── Login fields ── */
                <>
                  <div className="auth-field">
                    <span className="auth-field-label">Email or Username</span>
                    <input
                      autoFocus
                      autoComplete="username"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      className="auth-field-input"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <span className="auth-field-label">Password</span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-field-input"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-field">
                    <span className="auth-field-label">Email</span>
                    <input
                      type="email"
                      autoFocus
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-field-input"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <span className="auth-field-label">Username</span>
                    <input
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="auth-field-input"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <span className="auth-field-label">Password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-field-input"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <span className="auth-field-label">Confirm Password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="auth-field-input"
                      required
                    />
                  </div>
                </>
              )}

            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}