import React, { useState } from 'react'
import Panel from '../Panel'
import { useAuth } from '../../context/AuthProvider'

interface RegisterPanelProps {
  onClose: () => void
  onSwitchToLogin: () => void
}

export default function RegisterPanel({ onClose, onSwitchToLogin }: RegisterPanelProps) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await register(email, username, password)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <Panel>
          <div className="w-[420px] p-4">
            <h2 className="mb-4 text-lg font-semibold">Register for LigaHub</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-inset w-full"
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-inset w-full"
                  placeholder="username"
                  pattern="[a-zA-Z0-9_-]+"
                  title="Only letters, numbers, underscores, and hyphens"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-inset w-full"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-inset w-full"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Already have an account? Login
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="toolbar-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="toolbar-btn" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Panel>
      </div>
    </div>
  )
}
