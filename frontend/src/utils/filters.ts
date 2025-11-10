import type { Post as PostType, Thread as ThreadType } from '../data/types'
export function filterPostsBySearch(posts: PostType[], query: string) {
  if (!query) return posts
  const q = query.toLowerCase()
  return posts.filter(p => ((p.body || '') as string).toLowerCase().includes(q))
}
export function filterThreadsBySearchAndCategory(threads: ThreadType[], category: string, query: string) {
  const list = threads.filter(t => t.category === category)
  if (!query) return list
  const q = query.toLowerCase()
  return list.filter(t => ((t.title || '') as string).toLowerCase().includes(q))
}
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}
