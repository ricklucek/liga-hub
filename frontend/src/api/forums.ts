import { api } from './http'
import type { User } from './auth'

export interface ForumCategory {
  id: number
  slug: string
  name: string
}

export interface ForumAuthor {
  id: string
  username: string
  avatarUrl?: string | null
  role?: string
}

export interface ForumThread {
  id: number
  categoryId: number
  category?: ForumCategory
  authorId: string
  author: ForumAuthor
  title: string
  body?: string | null
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  lastActivityAt: string
  voteScore?: number
  userVote?: number
  postCount?: number
}

export interface ForumPost {
  id: number
  threadId: number
  authorId: string
  author: ForumAuthor
  body: string
  parentId?: number | null
  createdAt: string
  deletedAt?: string | null
}

export interface ThreadWithPosts extends ForumThread {
  posts: ForumPost[]
  votes: { value: number; userId: string }[]
}

export interface ThreadsListResponse {
  threads: ForumThread[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export const ForumsAPI = {
  /**
   * Get all forum categories
   */
  categories: () => api<ForumCategory[]>('/api/forums/categories'),

  /**
   * Create a new thread
   */
  createThread: (payload: { categoryId: number; title: string; body?: string }) =>
    api<ForumThread>('/api/forums/threads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * List threads with pagination and sorting
   */
  listThreads: (params: {
    categoryId?: number
    sort?: 'hot' | 'new' | 'top'
    page?: number
    pageSize?: number
  }) => {
    const query = new URLSearchParams()
    if (params.categoryId) query.set('categoryId', String(params.categoryId))
    if (params.sort) query.set('sort', params.sort)
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))

    return api<ThreadsListResponse>(`/api/forums/threads?${query.toString()}`)
  },

  /**
   * Get a single thread with its posts
   */
  getThread: (id: number) => api<ThreadWithPosts>(`/api/forums/threads/${id}`),

  /**
   * Reply to a thread
   */
  reply: (threadId: number, payload: { body: string; parentId?: number }) =>
    api<ForumPost>(`/api/forums/threads/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** List forum posts by a specific user (with first-level replies) */
  postsByUser: (authorId: string) => api<{ posts: ForumPost[] & { thread?: { id: number; title: string; slug?: string } ; replies?: ForumPost[] }[] }>(`/api/forums/posts?authorId=${encodeURIComponent(authorId)}`),

  /**
   * Vote on a thread
   */
  vote: (threadId: number, value: -1 | 0 | 1) =>
    api<{ success: boolean }>(`/api/forums/threads/${threadId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
}

export const AdminAPI = {
  /**
   * Pin/unpin a thread (MOD/ADMIN)
   */
  pinThread: (threadId: number) =>
    api<{ success: boolean; isPinned: boolean }>(`/api/admin/threads/${threadId}/pin`, {
      method: 'POST',
    }),

  /**
   * Lock/unlock a thread (MOD/ADMIN)
   */
  lockThread: (threadId: number) =>
    api<{ success: boolean; isLocked: boolean }>(`/api/admin/threads/${threadId}/lock`, {
      method: 'POST',
    }),

  /**
   * Soft delete a post (MOD/ADMIN)
   */
  deletePost: (postId: number) =>
    api<{ success: boolean }>(`/api/admin/posts/${postId}`, {
      method: 'DELETE',
    }),

  /**
   * Delete a thread (ADMIN)
   */
  deleteThread: (threadId: number) =>
    api<{ success: boolean }>(`/api/admin/threads/${threadId}`, {
      method: 'DELETE',
    }),
}
