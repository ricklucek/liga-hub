import 'dotenv/config'
import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import { withCookies, getUserFromSession } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import forumsRoutes from './routes/forums.js'
import adminRoutes from './routes/admin.js'

const app = express()

// CORS - allow credentials from localhost:5173
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))
app.use(withCookies)
app.use(getUserFromSession)

const PORT = process.env.PORT || 8787
const SGG_URL = 'https://api.start.gg/gql/alpha'
const CACHE_TTL_MS = 60 * 1000

if (!process.env.STARTGG_TOKEN || process.env.STARTGG_TOKEN.length < 20) {
  console.error('STARTGG_TOKEN missing/too short. Add to .env and restart.')
  process.exit(1)
}
const STARTGG_TOKEN = (process.env.STARTGG_TOKEN || '').trim()

const cache = new Map()
const cacheKey = (query, variables) => JSON.stringify({ q: query, v: variables })

async function proxyStartGG(query, variables = {}) {
  const key = cacheKey(query, variables)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data
  }

  const response = await fetch(SGG_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STARTGG_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const payload = await response.json().catch(async () => {
    const fallback = await response.text().catch(() => '')
    return { errors: [{ message: 'Invalid JSON from Start.gg', body: fallback }] }
  })

  if (!response.ok || payload.errors) {
    throw { message: 'Start.gg error', status: response.status, ...payload }
  }

  cache.set(key, { ts: Date.now(), data: payload.data })
  return payload.data
}

const handleError = (res, err) => {
  console.error(err)
  res.status(500).json({
    success: false,
    message: err?.message || 'Unexpected proxy error',
    ...(err?.errors ? { errors: err.errors } : {}),
  })
}

// Mount API routes
app.use('/api/auth', authRoutes)
app.use('/api/forums', forumsRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, services: ['startgg', 'forums', 'auth'] })
})

// Start.gg proxy routes (keep existing)

app.get('/api/sgg/health', (_req, res) => {
  res.json({ ok: true, tokenLoaded: !!process.env.STARTGG_TOKEN })
})

app.post('/api/sgg/videogames', async (req, res) => {
  try {
    const { names = [] } = req.body || {}
    const uniqueNames = Array.from(
      new Set(
        names
          .map((name) => (typeof name === 'string' ? name.trim() : ''))
          .filter((name) => name.length > 1),
      ),
    )

    if (!uniqueNames.length) {
      return res.json([])
    }

    const query = `
      query GameId($name:String!){
        videogames(query:{ filter:{ name:$name } }){
          nodes { id name }
        }
      }`

    const responses = await Promise.all(
      uniqueNames.map(async (name) => {
        const data = await proxyStartGG(query, { name })
        return data?.videogames?.nodes || []
      }),
    )

    const deduped = []
    const seen = new Set()
    responses.flat().forEach((node) => {
      if (node && !seen.has(node.id)) {
        seen.add(node.id)
        deduped.push(node)
      }
    })

    res.json(deduped)
  } catch (err) {
    handleError(res, err)
  }
})

app.post('/api/sgg/tournaments', async (req, res) => {
  try {
    const { videogameIds = [], countryCode = 'BR', perPage = 20 } = req.body || {}
    const query = `
      query TournamentsByGameAndCountry($perPage:Int!,$c:String!,$g:[ID]){
        tournaments(query:{
          page:1,
          perPage:$perPage,
          sortBy:"startAt asc",
          filter:{ upcoming:true, countryCode:$c, videogameIds:$g }
        }){
          nodes { id name slug city startAt endAt countryCode }
        }
      }`
    const data = await proxyStartGG(query, { perPage, c: countryCode, g: videogameIds })
    res.json(data?.tournaments?.nodes || [])
  } catch (err) {
    handleError(res, err)
  }
})

app.post('/api/sgg/eventsByTournament', async (req, res) => {
  try {
    const { slug } = req.body || {}
    const query = `
      query EventsInTournament($slug:String!){
        tournament(slug:$slug){
          id
          name
          events{
            id
            name
            slug
            videogame{ id name }
          }
        }
      }`
    const data = await proxyStartGG(query, { slug })
    res.json(data?.tournament?.events || [])
  } catch (err) {
    handleError(res, err)
  }
})

app.post('/api/sgg/eventEntrants', async (req, res) => {
  try {
    const { eventId, page = 1, perPage = 25 } = req.body || {}
    const query = `
      query EventEntrants($eventId:ID!,$page:Int!,$perPage:Int!){
        event(id:$eventId){
          entrants(query:{page:$page, perPage:$perPage}){
            pageInfo{ total totalPages }
            nodes{ id name }
          }
        }
      }`
    const data = await proxyStartGG(query, { eventId, page, perPage })
    res.json(data?.event?.entrants || { pageInfo: { total: 0, totalPages: 0 }, nodes: [] })
  } catch (err) {
    handleError(res, err)
  }
})

app.post('/api/sgg/eventSets', async (req, res) => {
  try {
    const { eventId, page = 1, perPage = 20 } = req.body || {}
    const query = `
      query EventSets($eventId:ID!,$page:Int!,$perPage:Int!){
        event(id:$eventId){
          sets(page:$page, perPage:$perPage, sortType:STANDARD){
            pageInfo{ total }
            nodes{
              id
              round
              slots{ entrant{ id name } }
            }
          }
        }
      }`
    const data = await proxyStartGG(query, { eventId, page, perPage })
    res.json(data?.event?.sets || { pageInfo: { total: 0 }, nodes: [] })
  } catch (err) {
    handleError(res, err)
  }
})

app.listen(PORT, () => {
  console.log(`Start.gg proxy listening on http://localhost:${PORT}`)
})
