import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import { withCookies, getUserFromSession } from '../server/middleware/auth.js'
import authRoutes from '../server/routes/auth.js'
import forumsRoutes from '../server/routes/forums.js'
import { db } from '../server/db.js'

// Create test app
const app = express()
app.use(cors({ credentials: true }))
app.use(express.json())
app.use(withCookies)
app.use(getUserFromSession)
app.use('/api/auth', authRoutes)
app.use('/api/forums', forumsRoutes)

describe('Forums Routes', () => {
  let testUser: any
  let sessionCookie: string
  let categoryId: number
  let threadId: number

  beforeAll(async () => {
    // Create test user
    const passwordHash = await bcrypt.hash('password123', 11)
    testUser = await db.user.create({
      data: {
        email: 'forumtest@example.com',
        username: 'forumtest',
        passwordHash,
        role: 'USER',
      },
    })

    // Login to get session cookie
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: 'forumtest',
        password: 'password123',
      })

    sessionCookie = response.headers['set-cookie'][0].split(';')[0]

    // Get first category
    const categories = await db.forumCategory.findMany()
    categoryId = categories[0].id
  })

  afterAll(async () => {
    // Cleanup: delete test data
    await db.forumPost.deleteMany({ where: { authorId: testUser.id } })
    await db.forumVote.deleteMany({ where: { userId: testUser.id } })
    await db.forumThread.deleteMany({ where: { authorId: testUser.id } })
    await db.session.deleteMany({ where: { userId: testUser.id } })
    await db.user.delete({ where: { id: testUser.id } })
    await db.$disconnect()
  })

  describe('GET /api/forums/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app).get('/api/forums/categories').expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('slug')
      expect(response.body[0]).toHaveProperty('name')
    })
  })

  describe('POST /api/forums/threads', () => {
    it('should create a new thread', async () => {
      const response = await request(app)
        .post('/api/forums/threads')
        .set('Cookie', sessionCookie)
        .send({
          categoryId,
          title: 'Test Thread',
          body: 'This is a test thread body',
        })
        .expect(200)

      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe('Test Thread')
      expect(response.body.body).toBe('This is a test thread body')

      threadId = response.body.id
    })

    it('should require authentication', async () => {
      await request(app)
        .post('/api/forums/threads')
        .send({
          categoryId,
          title: 'Test Thread',
        })
        .expect(401)
    })

    it('should validate title length', async () => {
      await request(app)
        .post('/api/forums/threads')
        .set('Cookie', sessionCookie)
        .send({
          categoryId,
          title: 'Hi',
        })
        .expect(400)
    })
  })

  describe('GET /api/forums/threads', () => {
    it('should list threads', async () => {
      const response = await request(app)
        .get(`/api/forums/threads?categoryId=${categoryId}`)
        .expect(200)

      expect(response.body).toHaveProperty('threads')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.threads).toBeInstanceOf(Array)
    })

    it('should support sorting', async () => {
      const response = await request(app)
        .get(`/api/forums/threads?categoryId=${categoryId}&sort=new`)
        .expect(200)

      expect(response.body.threads).toBeInstanceOf(Array)
    })
  })

  describe('GET /api/forums/threads/:id', () => {
    it('should get thread with posts', async () => {
      const response = await request(app)
        .get(`/api/forums/threads/${threadId}`)
        .expect(200)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title')
      expect(response.body).toHaveProperty('posts')
      expect(response.body.posts).toBeInstanceOf(Array)
    })

    it('should return 404 for non-existent thread', async () => {
      await request(app).get('/api/forums/threads/99999').expect(404)
    })
  })

  describe('POST /api/forums/threads/:id/posts', () => {
    it('should create a reply', async () => {
      const response = await request(app)
        .post(`/api/forums/threads/${threadId}/posts`)
        .set('Cookie', sessionCookie)
        .send({
          body: 'This is a test reply',
        })
        .expect(200)

      expect(response.body).toHaveProperty('id')
      expect(response.body.body).toBe('This is a test reply')
    })

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/forums/threads/${threadId}/posts`)
        .send({
          body: 'Test',
        })
        .expect(401)
    })
  })

  describe('POST /api/forums/threads/:id/vote', () => {
    it('should upvote a thread', async () => {
      const response = await request(app)
        .post(`/api/forums/threads/${threadId}/vote`)
        .set('Cookie', sessionCookie)
        .send({
          value: 1,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should downvote a thread', async () => {
      const response = await request(app)
        .post(`/api/forums/threads/${threadId}/vote`)
        .set('Cookie', sessionCookie)
        .send({
          value: -1,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/forums/threads/${threadId}/vote`)
        .send({
          value: 1,
        })
        .expect(401)
    })
  })
})
