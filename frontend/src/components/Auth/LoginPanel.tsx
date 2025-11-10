import React, { useState } from 'react'
import Panel from '../Panel'
import { useAuth } from '../../context/AuthProvider'

interface LoginPanelProps {
  onClose: () => void
  onSwitchToRegister: () => void
}

export default function LoginPanel({ onClose, onSwitchToRegister }: LoginPanelProps) {
  const { login } = useAuth()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(emailOrUsername, password)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <Panel>
          <div className="w-[420px] p-4">
            <h2 className="mb-4 text-lg font-semibold">Login to LigaHub</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Email or Username</label>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="input-inset w-full"
                  placeholder="your@email.com or username"
                  required
                  autoFocus
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

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Need an account? Register
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
                    {loading ? 'Logging in...' : 'Login'}
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
