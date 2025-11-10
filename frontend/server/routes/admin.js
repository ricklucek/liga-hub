import { Router } from 'express'
import { db } from '../db.js'
import { requireRole } from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/admin/threads/:id/pin
 * Pin or unpin a thread (MOD/ADMIN only)
 */
router.post('/threads/:id/pin', requireRole('MOD'), async (req, res) => {
  try {
    const threadId = parseInt(req.params.id, 10)

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    const updated = await db.forumThread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
    })

    res.json({ success: true, isPinned: updated.isPinned })
  } catch (err) {
    console.error('Pin thread error:', err)
    res.status(500).json({ error: 'Failed to pin thread' })
  }
})

/**
 * POST /api/admin/threads/:id/lock
 * Lock or unlock a thread (MOD/ADMIN only)
 */
router.post('/threads/:id/lock', requireRole('MOD'), async (req, res) => {
  try {
    const threadId = parseInt(req.params.id, 10)

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    const updated = await db.forumThread.update({
      where: { id: threadId },
      data: { isLocked: !thread.isLocked },
    })

    res.json({ success: true, isLocked: updated.isLocked })
  } catch (err) {
    console.error('Lock thread error:', err)
    res.status(500).json({ error: 'Failed to lock thread' })
  }
})

/**
 * DELETE /api/admin/posts/:id
 * Soft delete a post (MOD/ADMIN only)
 */
router.delete('/posts/:id', requireRole('MOD'), async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10)

    const post = await db.forumPost.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.deletedAt) {
      return res.status(400).json({ error: 'Post already deleted' })
    }

    await db.forumPost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete post error:', err)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

/**
 * DELETE /api/admin/threads/:id
 * Delete a thread (ADMIN only)
 */
router.delete('/threads/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const threadId = parseInt(req.params.id, 10)

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    // Delete all posts and votes, then delete thread
    await db.$transaction([
      db.forumPost.deleteMany({ where: { threadId } }),
      db.forumVote.deleteMany({ where: { threadId } }),
      db.forumThread.delete({ where: { id: threadId } }),
    ])

    res.json({ success: true })
  } catch (err) {
    console.error('Delete thread error:', err)
    res.status(500).json({ error: 'Failed to delete thread' })
  }
})

export default router
