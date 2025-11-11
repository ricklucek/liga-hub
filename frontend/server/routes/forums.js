import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { createThreadLimiter, createPostLimiter, voteLimiter } from '../middleware/rateLimit.js'

const router = Router()

// Validation schemas
const createThreadSchema = z.object({
  categoryId: z.number().int().positive(),
  title: z.string().min(4).max(140),
  body: z.string().min(1).max(10000).optional(),
})

const createPostSchema = z.object({
  body: z.string().min(1).max(10000),
  parentId: z.number().int().positive().optional(),
})

const voteSchema = z.object({
  value: z.number().int().min(-1).max(1),
})

const listThreadsSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  sort: z.enum(['hot', 'new', 'top']).optional().default('hot'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
})

/**
 * GET /api/forums/categories
 * List all forum categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.forumCategory.findMany({
      orderBy: { id: 'asc' },
    })
    res.json(categories)
  } catch (err) {
    console.error('Get categories error:', err)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

/**
 * POST /api/forums/threads
 * Create a new thread
 */
router.post('/threads', requireAuth, createThreadLimiter, validate(createThreadSchema), async (req, res) => {
  try {
    const { categoryId, title, body } = req.body

    // Verify category exists
    const category = await db.forumCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    const thread = await db.forumThread.create({
      data: {
        categoryId,
        authorId: req.user.id,
        title,
        body: body || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    })

    res.json(thread)
  } catch (err) {
    console.error('Create thread error:', err)
    res.status(500).json({ error: 'Failed to create thread' })
  }
})

/**
 * GET /api/forums/threads
 * List threads with pagination and sorting
 */
router.get('/threads', validate(listThreadsSchema, 'query'), async (req, res) => {
  try {
    const { categoryId, sort, page, pageSize } = req.query

    const where = categoryId ? { categoryId } : {}

    // Get total count
    const total = await db.forumThread.count({ where })

    // Determine sort order
    let orderBy = []
    if (sort === 'new') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sort === 'top') {
      // For 'top', we'll fetch all and sort by vote score in memory
      // (SQLite doesn't have great aggregation sorting options)
      orderBy = [{ createdAt: 'desc' }]
    } else {
      // 'hot' - combine votes and recency
      orderBy = [{ lastActivityAt: 'desc' }]
    }

    const threads = await db.forumThread.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        category: true,
        votes: {
          select: { value: true },
        },
        _count: {
          select: { posts: true },
        },
      },
    })

    // Calculate vote scores and apply sorting
    let enrichedThreads = threads.map((t) => {
      const voteScore = t.votes.reduce((sum, v) => sum + v.value, 0)
      return {
        ...t,
        voteScore,
        postCount: t._count.posts,
      }
    })

    // Sort by 'top' if needed
    if (sort === 'top') {
      enrichedThreads.sort((a, b) => b.voteScore - a.voteScore)
    } else if (sort === 'hot') {
      // Hot = mix of votes and recency (simple formula)
      enrichedThreads.sort((a, b) => {
        const aScore = a.voteScore + (new Date(a.lastActivityAt).getTime() / 1e9)
        const bScore = b.voteScore + (new Date(b.lastActivityAt).getTime() / 1e9)
        return bScore - aScore
      })
    }

    res.json({
      threads: enrichedThreads,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (err) {
    console.error('List threads error:', err)
    res.status(500).json({ error: 'Failed to fetch threads' })
  }
})

/**
 * GET /api/forums/threads/:id
 * Get a single thread with its posts
 */
router.get('/threads/:id', async (req, res) => {
  try {
    const threadId = parseInt(req.params.id, 10)

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            role: true,
          },
        },
        category: true,
        votes: {
          select: { value: true, userId: true },
        },
        posts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    const voteScore = thread.votes.reduce((sum, v) => sum + v.value, 0)
    const userVote = req.user ? thread.votes.find((v) => v.userId === req.user.id)?.value || 0 : 0

    res.json({
      ...thread,
      voteScore,
      userVote,
    })
  } catch (err) {
    console.error('Get thread error:', err)
    res.status(500).json({ error: 'Failed to fetch thread' })
  }
})

/**
 * POST /api/forums/threads/:id/posts
 * Reply to a thread
 */
router.post('/threads/:id/posts', requireAuth, createPostLimiter, validate(createPostSchema), async (req, res) => {
  try {
    const threadId = parseInt(req.params.id, 10)
    const { body, parentId } = req.body

    // Verify thread exists and is not locked
    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    if (thread.isLocked) {
      return res.status(403).json({ error: 'Thread is locked' })
    }

    // Create post and update thread's lastActivityAt
    const [post] = await db.$transaction([
      db.forumPost.create({
        data: {
          threadId,
          authorId: req.user.id,
          body,
          parentId: parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.forumThread.update({
        where: { id: threadId },
        data: { lastActivityAt: new Date() },
      }),
    ])

    res.json(post)
  } catch (err) {
    console.error('Create post error:', err)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

/**
 * POST /api/forums/threads/:id/vote
 * Vote on a thread (upvote or downvote)
 */
router.post('/threads/:id/vote', requireAuth, voteLimiter, validate(voteSchema), async (req, res) => {
  try {
    const threadId = parseInt(req.params.id, 10)
    const { value } = req.body

    // Verify thread exists
    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    // Upsert vote
    if (value === 0) {
      // Remove vote
      await db.forumVote.deleteMany({
        where: {
          userId: req.user.id,
          threadId,
        },
      })
    } else {
      await db.forumVote.upsert({
        where: {
          userId_threadId: {
            userId: req.user.id,
            threadId,
          },
        },
        update: { value },
        create: {
          userId: req.user.id,
          threadId,
          value,
        },
      })
    }

    // Update thread's lastActivityAt
    await db.forumThread.update({
      where: { id: threadId },
      data: { lastActivityAt: new Date() },
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Vote error:', err)
    res.status(500).json({ error: 'Failed to vote' })
  }
})

export default router

/**
 * GET /api/forums/posts?authorId=...
 * List forum posts authored by a user, include thread summary and first-level replies
 */
router.get('/posts', async (req, res) => {
  try {
    const { authorId } = req.query
    console.log('GET /api/forums/posts authorId=', authorId)
    if (!authorId) return res.status(400).json({ error: 'Missing authorId' })

    const posts = await db.forumPost.findMany({
      where: { authorId: String(authorId), deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, role: true } },
        // ForumThread does not have a `slug` field in the schema; only select valid fields
        thread: { select: { id: true, title: true } },
      },
      take: 200,
    })

    // Fetch first-level replies for each post
    const results = await Promise.all(posts.map(async (p) => {
      const replies = await db.forumPost.findMany({
        where: { parentId: p.id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, username: true, avatarUrl: true, role: true } } },
      })
      return { ...p, replies }
    }))
    console.log(`Found ${results.length} forum posts for ${authorId}`)

    res.json({ posts: results })
  } catch (err) {
    console.error('List posts by user error:', err)
    res.status(500).json({ error: 'Failed to fetch user posts' })
  }
})
