import React, { createContext, useContext, useState } from 'react'
import type { User, League } from '../data/types'

type UserContext = {
  users: User[]
  currentUser: User | null
  signup: (name: string, role: User['role']) => User
  login: (id: string) => void
  logout: () => void
  leagues: League[]
  createLeague: (name: string) => League | null
}

const Ctx = createContext<UserContext | null>(null)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'Alice', role: 'user' },
    { id: 'u2', name: 'Bruno', role: 'organizer' }
  ])
  const [currentUser, setCurrentUser] = useState<User | null>(users[0])
  const [leagues, setLeagues] = useState<League[]>([])

  function signup(name: string, role: User['role']) {
    const u: User = { id: `u${Date.now()}`, name, role }
    setUsers(prev => [u, ...prev])
    setCurrentUser(u)
    return u
  }
  function login(id: string) {
    const u = users.find(x => x.id === id) || null
    setCurrentUser(u)
  }
  function logout() {
    setCurrentUser(null)
  }
  function createLeague(name: string) {
    if (!currentUser || currentUser.role !== 'organizer') return null
    const l: League = { id: `l${Date.now()}`, name, organizerId: currentUser.id, teams: 0 }
    setLeagues(prev => [l, ...prev])
    return l
  }

  return (
    <Ctx.Provider value={{ users, currentUser, signup, login, logout, leagues, createLeague }}>
      {children}
    </Ctx.Provider>
  )
}

export function useUsers() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useUsers must be used within UserProvider')
  return ctx
}
