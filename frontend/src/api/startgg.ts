export type VideogameRef = { id: string; name: string }
export type TournamentSummary = {
  id: string
  name: string
  slug: string
  city?: string | null
  startAt?: number | null
  endAt?: number | null
  countryCode?: string | null
}
export type EventSummary = { id: string; name: string; slug: string; videogame?: { id: string; name: string } | null }
export type EntrantsPage = {
  pageInfo: { total: number; totalPages: number }
  nodes: { id: string; name: string }[]
}
export type SetsPage = {
  pageInfo: { total: number }
  nodes: { id: string; round: number; slots: { entrant: { id: string; name: string } | null }[] }[]
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`http://localhost:8787${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json() as Promise<T>
}

export const sgg = {
  videogames: (names: string[]) => post<VideogameRef[]>('/api/sgg/videogames', { names }),
  tournaments: (videogameIds: (string | number)[], countryCode = 'BR', perPage = 20) =>
    post<TournamentSummary[]>('/api/sgg/tournaments', { videogameIds, countryCode, perPage }),
  eventsByTournament: (slug: string) =>
    post<EventSummary[]>('/api/sgg/eventsByTournament', { slug }),
  eventEntrants: (eventId: string | number, page = 1, perPage = 25) =>
    post<EntrantsPage>('/api/sgg/eventEntrants', { eventId, page, perPage }),
  eventSets: (eventId: string | number, page = 1, perPage = 20) =>
    post<SetsPage>('/api/sgg/eventSets', { eventId, page, perPage }),
}
