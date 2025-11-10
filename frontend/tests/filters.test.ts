import { describe, it, expect } from 'vitest'
import { filterPostsBySearch, filterThreadsBySearchAndCategory, paginate } from '../src/utils/filters'

describe('filters', () => {
  it('filterPostsBySearch returns all when empty query', () => {
    const posts = [{ body: 'hello' }, { body: 'world' }]
    expect(filterPostsBySearch(posts as any, '')).toHaveLength(2)
  })
  it('filterPostsBySearch filters correctly', () => {
    const posts = [{ body: 'hello' }, { body: 'world' }]
    expect(filterPostsBySearch(posts as any, 'wor')).toHaveLength(1)
  })

  it('filterThreadsBySearchAndCategory filters by category then query', () => {
    const threads = [{ category: 'general', title: 'Hi' }, { category: 'other', title: 'Hi' }]
    expect(filterThreadsBySearchAndCategory(threads as any, 'general', '')).toHaveLength(1)
    expect(filterThreadsBySearchAndCategory(threads as any, 'general', 'h')).toHaveLength(1)
  })

  it('paginate slices correctly', () => {
    const items = [1,2,3,4,5]
    expect(paginate(items, 1, 2)).toEqual([1,2])
    expect(paginate(items, 3, 2)).toEqual([5])
  })
})
