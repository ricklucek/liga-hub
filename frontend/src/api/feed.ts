import { api } from './http'

export interface FeedAuthor {
  id: string
  username: string
  avatarUrl?: string | null
  role?: string
}

export interface FeedPost {
  id: string
  authorId: string
  author: FeedAuthor
  body: string
  imageBase64?: string | null
  imageMime?: string | null
  imageFilename?: string | null
  createdAt: string
}

export const FeedAPI = {
  list: (params?: { authorId?: string }) => {
    const q = new URLSearchParams()
    if (params?.authorId) q.set('authorId', params.authorId)
    const url = q.toString() ? `/api/feed?${q.toString()}` : '/api/feed'
    return api<FeedPost[]>(url)
  },

  /**
   * Create a new feed post. Optionally include imageBase64 (no data URL prefix) and image metadata.
   */
  create: (payload: { body: string; imageBase64?: string | null; imageMime?: string | null; imageFilename?: string | null }) =>
    api<FeedPost>('/api/feed', { method: 'POST', body: JSON.stringify(payload) }),
}

export default FeedAPI
