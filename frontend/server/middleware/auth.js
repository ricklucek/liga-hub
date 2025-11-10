import cookieParser from 'cookie-parser'
import crypto from 'crypto'
import { db } from '../db.js'

export const withCookies = cookieParser()

/**
 * Middleware to extract and validate session from httpOnly cookie.
 * Attaches req.user and req.session if valid.
 */
export async function getUserFromSession(req, res, next) {
  try {
    const sid = req.cookies?.session
    if (!sid) {
      req.user = null
      return next()
    }

    // Hash the opaque token to look up session in DB
    const tokenHash = crypto.createHash('sha256').update(sid).digest('hex')
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      req.user = null
      return next()
    }

    req.user = session.user
    req.session = session
    next()
  } catch (e) {
    next(e)
  }
}

/**
 * Middleware to require authentication.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

/**
 * Middleware to require a minimum role level.
 * Role hierarchy: USER < MOD < ADMIN
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const order = { USER: 1, MOD: 2, ADMIN: 3 }
    if (order[req.user.role] < order[role]) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  }
}

/**
 * Generate a random session token and hash.
 * Returns { token, tokenHash, expiresAt }
 */
export function createSessionCookie({ days = 14 } = {}) {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return { token, tokenHash, expiresAt }
}
