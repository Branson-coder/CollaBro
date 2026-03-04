import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AuthPage() {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const switchMode = (m) => { setMode(m); setError(''); setEmail(''); setPassword(''); setConfirm('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register') {
      if (password !== confirm)  return setError('Passwords do not match')
      if (password.length < 6)   return setError('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      mode === 'login' ? await login({ email, password }) : await register({ email, password })
      navigate('/board')
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message
      setError(msg || (mode === 'login' ? 'Invalid email or password' : 'Could not create account'))
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
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Register</button>
          </div>

          <h2 className="auth-form-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="auth-form-sub">{mode === 'login' ? 'Sign in to your workspace' : 'Get started for free'}</p>

          <form onSubmit={handleSubmit}>
            <div className="auth-fields">
              <div className="auth-field">
                <span className="auth-field-label">Email</span>
                <input type="email" autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-field-input" required />
              </div>
              <div className="auth-field">
                <span className="auth-field-label">Password</span>
                <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="auth-field-input" required />
              </div>
              {mode === 'register' && (
                <div className="auth-field">
                  <span className="auth-field-label">Confirm Password</span>
                  <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="auth-field-input" required />
                </div>
              )}
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
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