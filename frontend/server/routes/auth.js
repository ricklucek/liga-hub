import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth, createSessionCookie } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'

const router = Router()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email().min(3).max(255),
  username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(6).max(100),
})

const loginSchema = z.object({
  emailOrUsername: z.string().min(2).max(255),
  password: z.string().min(1).max(100),
})

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { email, username, password } = req.body

    // Check if user already exists
    const existing = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existing) {
      return res.status(400).json({
        error: existing.email === email ? 'Email already registered' : 'Username already taken',
      })
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 11)
    const user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: 'USER',
      },
    })

    // Create session
    const { token, tokenHash, expiresAt } = createSessionCookie()
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // Set cookie
    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set to true in production with HTTPS
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    })

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        school: user.school,
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body

    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create session
    const { token, tokenHash, expiresAt } = createSessionCookie()
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // Set cookie
    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    })

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        school: user.school,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Failed to login' })
  }
})

/**
 * POST /api/auth/logout
 * Destroy current session
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    if (req.session) {
      await db.session.delete({
        where: { id: req.session.id },
      })
    }

    res.clearCookie('session')
    res.json({ success: true })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ error: 'Failed to logout' })
  }
})

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.json({ user: null })
  }

  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      avatarUrl: req.user.avatarUrl,
      school: req.user.school,
    },
  })
})

export default router
