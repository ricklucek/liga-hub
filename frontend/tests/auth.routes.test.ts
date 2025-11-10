import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import { withCookies, getUserFromSession } from '../server/middleware/auth.js'
import authRoutes from '../server/routes/auth.js'
import { db } from '../server/db.js'

// Create test app
const app = express()
app.use(cors({ credentials: true }))
app.use(express.json())
app.use(withCookies)
app.use(getUserFromSession)
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  const testUser = {
    email: 'authtest@example.com',
    username: 'authtest',
    password: 'password123',
  }

  let sessionCookie: string

  afterAll(async () => {
    // Cleanup: delete test user
    await db.user.deleteMany({
      where: { email: testUser.email },
    })
    await db.$disconnect()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(testUser.email)
      expect(response.body.user.username).toBe(testUser.username)
      expect(response.body.user.role).toBe('USER')

      // Should set cookie
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      sessionCookie = cookies[0].split(';')[0]
    })

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400)

      expect(response.body.error).toContain('already')
    })

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          username: 'testuser2',
          password: 'password123',
        })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          username: 'testuser2',
          password: '12345',
        })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user with valid session', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.username).toBe(testUser.username)
    })

    it('should return null without session', async () => {
      const response = await request(app).get('/api/auth/me').expect(200)

      expect(response.body.user).toBeNull()
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: testUser.password,
        })
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.username).toBe(testUser.username)
    })

    it('should login with email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(testUser.email)
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.error).toContain('Invalid')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should require authentication', async () => {
      await request(app).post('/api/auth/logout').expect(401)
    })
  })
})
