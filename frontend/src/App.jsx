import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Board from './pages/Board'
import AuthPage from './pages/AuthPage'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={< AuthPage/>} />
        <Route path="/board" element={
          <ProtectedRoute>
            <Board />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App