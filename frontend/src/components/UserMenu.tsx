import React, { useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import LoginPanel from './Auth/LoginPanel'
import RegisterPanel from './Auth/RegisterPanel'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [show, setShow] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShow(false)
  }

  const openLogin = () => {
    setShow(false)
    setShowLogin(true)
  }

  const openRegister = () => {
    setShow(false)
    setShowRegister(true)
  }

  return (
    <>
      <div className="relative">
        <button className="toolbar-btn" onClick={() => setShow((s) => !s)}>
          {user ? `${user.username}` : 'Sign in'}
        </button>
        {show && (
          <div className="absolute right-0 mt-2 w-[280px] rounded border border-neutral-300 bg-white p-3 shadow-lg z-10">
            {user ? (
              <>
                <div className="mb-2">
                  <div className="text-sm font-semibold">{user.username}</div>
                  <div className="text-xs text-neutral-600">{user.email}</div>
                  <div className="mt-1">
                    <span className="badge">{user.role}</span>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <button className="toolbar-btn w-full" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 text-sm font-semibold">Not logged in</div>
                <div className="flex gap-2">
                  <button className="toolbar-btn flex-1" onClick={openLogin}>
                    Login
                  </button>
                  <button className="toolbar-btn flex-1" onClick={openRegister}>
                    Register
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showLogin && (
        <LoginPanel
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
        />
      )}

      {showRegister && (
        <RegisterPanel
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
        />
      )}
    </>
  )
}
