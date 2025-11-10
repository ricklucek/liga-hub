export type Post = {
  id: string
  author: string
  avatar: string
  body: string
  image?: string | null
  likes: number
  comments: number
  createdAt: string
}
export type ThreadPost = { id: string; author: string; body: string; createdAt: number }
export type Thread = {
  id: string
  category: string
  title: string
  author: string
  createdAt: number
  posts: ThreadPost[]
  up: number
  down: number
  pinned: boolean
}
export type Category = { id: string; label: string }

export type User = {
  id: string
  name: string
  role: 'user' | 'organizer'
}

export type League = {
  id: string
  name: string
  organizerId: string
  teams?: number
}
