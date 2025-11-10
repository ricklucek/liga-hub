import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { post, sgg } from '../src/api/startgg'

const originalFetch = globalThis.fetch

const createResponse = (body: unknown, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
})

describe('start.gg api client', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('post sends payload to proxy base URL', async () => {
    ;(globalThis.fetch as any).mockResolvedValue(createResponse({ ok: true }))
    const payload = { foo: 'bar' }
    await post('/api/sgg/test', payload)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8787/api/sgg/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    )
  })

  it('post throws with server text on error', async () => {
    ;(globalThis.fetch as any).mockResolvedValue(createResponse('boom', false))
    await expect(post('/api/sgg/test', {})).rejects.toThrow('boom')
  })

  const cases: Array<{
    label: string
    call: () => Promise<unknown>
    path: string
    body: Record<string, unknown>
  }> = [
    {
      label: 'videogames',
      call: () => sgg.videogames(['League of Legends']),
      path: '/api/sgg/videogames',
      body: { names: ['League of Legends'] },
    },
    {
      label: 'tournaments',
      call: () => sgg.tournaments([1, 2], 'BR', 10),
      path: '/api/sgg/tournaments',
      body: { videogameIds: [1, 2], countryCode: 'BR', perPage: 10 },
    },
    {
      label: 'eventsByTournament',
      call: () => sgg.eventsByTournament('sample-slug'),
      path: '/api/sgg/eventsByTournament',
      body: { slug: 'sample-slug' },
    },
    {
      label: 'eventEntrants',
      call: () => sgg.eventEntrants('999', 2, 25),
      path: '/api/sgg/eventEntrants',
      body: { eventId: '999', page: 2, perPage: 25 },
    },
    {
      label: 'eventSets',
      call: () => sgg.eventSets('888', 3, 20),
      path: '/api/sgg/eventSets',
      body: { eventId: '888', page: 3, perPage: 20 },
    },
  ]

  cases.forEach(({ label, call, path, body }) => {
    it(`sgg.${label} hits ${path}`, async () => {
      ;(globalThis.fetch as any).mockResolvedValue(createResponse({ ok: true }))
      await call()
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `http://localhost:8787${path}`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      )
    })
  })
})
