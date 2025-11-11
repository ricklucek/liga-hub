import { api } from './http'

export type Role = 'USER' | 'ORGANIZER' | 'MOD' | 'ADMIN'

export interface User {
  id: string
  username: string
  email: string
  role: Role
  avatarUrl?: string | null
  school?: string | null
  createdAt?: string | null
}

export interface AuthResponse {
  user: User
}

export interface MeResponse {
  user: User | null
}

export const AuthAPI = {
  /**
   * Get current authenticated user
   */
  me: () => api<MeResponse>('/api/auth/me'),

  /**
   * Register a new user account
   */
  register: (payload: { email: string; username: string; password: string; role?: 'USER' | 'ORGANIZER' }) =>
    api<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Update current user's avatar */
  updateAvatar: (payload: { imageBase64: string | null; imageMime?: string | null; imageFilename?: string | null }) =>
    api<AuthResponse>('/api/auth/avatar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Login with email/username and password
   */
  login: (payload: { emailOrUsername: string; password: string }) =>
    api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Logout current user
   */
  logout: () =>
    api<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),
}
