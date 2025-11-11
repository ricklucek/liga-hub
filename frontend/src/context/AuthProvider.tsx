import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthAPI, type User } from '../api/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  register: (email: string, username: string, password: string, role?: 'USER' | 'ORGANIZER') => Promise<void>
  login: (emailOrUsername: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const response = await AuthAPI.me()
      setUser(response.user)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const register = async (email: string, username: string, password: string, role: 'USER' | 'ORGANIZER' = 'USER') => {
    try {
      const response = await AuthAPI.register({ email, username, password, role })
      setUser(response.user)
    } catch (err) {
      throw err
    }
  }

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const response = await AuthAPI.login({ emailOrUsername, password })
      setUser(response.user)
    } catch (err) {
      throw err
    }
  }

  const logout = async () => {
    try {
      await AuthAPI.logout()
      setUser(null)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const refetch = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
