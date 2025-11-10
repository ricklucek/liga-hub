import rateLimit from 'express-rate-limit'

/**
 * Rate limiter for thread creation: 10 requests per 15 minutes
 */
export const createThreadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many threads created. Please wait before creating another.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for post creation: 20 requests per minute
 */
export const createPostLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many posts. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for voting: 30 votes per minute
 */
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many votes. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Generic write limiter for auth operations
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
