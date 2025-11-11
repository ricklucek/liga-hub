import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db.js'

const router = express.Router()

// List feed posts (most recent first)
router.get('/', async (req, res) => {
  try {
    const { authorId } = req.query || {}
    const where = authorId ? { authorId: String(authorId) } : {}
    const posts = await db.feedPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, username: true, avatarUrl: true, role: true } } },
      take: 50,
    })

    // Map imageBytes to a base64 string for the client (if present)
    const mapped = posts.map((p) => ({
      id: p.id,
      authorId: p.authorId,
      author: p.author,
      body: p.body,
      imageBase64: p.imageBytes ? Buffer.from(p.imageBytes).toString('base64') : null,
      imageMime: p.imageMime || null,
      imageFilename: p.imageFilename || null,
      createdAt: p.createdAt,
    }))

    res.json(mapped)
  } catch (err) {
    console.error('List feed posts error', err)
    res.status(500).json({ error: 'Failed to fetch feed posts' })
  }
})

// Create a feed post (requires authentication)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { body = '', imageBase64, imageMime, imageFilename } = req.body || {}
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Missing body' })
    }

    const data = {
      authorId: req.user.id,
      body: String(body).trim(),
      imageMime: imageMime || null,
      imageFilename: imageFilename || null,
      imageBytes: imageBase64 ? Buffer.from(imageBase64, 'base64') : null,
    }

    const post = await db.feedPost.create({
      data,
      include: { author: { select: { id: true, username: true, avatarUrl: true, role: true } } },
    })

    res.json({
      id: post.id,
      authorId: post.authorId,
      author: post.author,
      body: post.body,
      imageBase64: post.imageBytes ? Buffer.from(post.imageBytes).toString('base64') : null,
      imageMime: post.imageMime || null,
      imageFilename: post.imageFilename || null,
      createdAt: post.createdAt,
    })
  } catch (err) {
    console.error('Create feed post error', err)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

export default router
