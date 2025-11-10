import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('Auth Validators', () => {
  const registerSchema = z.object({
    email: z.string().email().min(3).max(255),
    username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/),
    password: z.string().min(6).max(100),
  })

  const loginSchema = z.object({
    emailOrUsername: z.string().min(2).max(255),
    password: z.string().min(1).max(100),
  })

  describe('Register Schema', () => {
    it('should validate valid registration data', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      }
      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = {
        email: 'not-an-email',
        username: 'testuser',
        password: 'password123',
      }
      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: '12345',
      }
      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid username characters', () => {
      const data = {
        email: 'test@example.com',
        username: 'test user!',
        password: 'password123',
      }
      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Login Schema', () => {
    it('should validate valid login data', () => {
      const data = {
        emailOrUsername: 'testuser',
        password: 'password123',
      }
      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept email as emailOrUsername', () => {
      const data = {
        emailOrUsername: 'test@example.com',
        password: 'password123',
      }
      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})

describe('Forum Validators', () => {
  const createThreadSchema = z.object({
    categoryId: z.number().int().positive(),
    title: z.string().min(4).max(140),
    body: z.string().min(1).max(10000).optional(),
  })

  const createPostSchema = z.object({
    body: z.string().min(1).max(10000),
    parentId: z.number().int().positive().optional(),
  })

  describe('Create Thread Schema', () => {
    it('should validate valid thread data', () => {
      const data = {
        categoryId: 1,
        title: 'Test Thread',
        body: 'This is a test thread body',
      }
      const result = createThreadSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject short title', () => {
      const data = {
        categoryId: 1,
        title: 'Hi',
        body: 'Body',
      }
      const result = createThreadSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject long title', () => {
      const data = {
        categoryId: 1,
        title: 'a'.repeat(141),
        body: 'Body',
      }
      const result = createThreadSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should allow thread without body', () => {
      const data = {
        categoryId: 1,
        title: 'Test Thread',
      }
      const result = createThreadSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('Create Post Schema', () => {
    it('should validate valid post data', () => {
      const data = {
        body: 'This is a test post',
      }
      const result = createPostSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty body', () => {
      const data = {
        body: '',
      }
      const result = createPostSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept optional parentId', () => {
      const data = {
        body: 'Reply to a post',
        parentId: 123,
      }
      const result = createPostSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
