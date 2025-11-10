import { useEffect, useMemo, useState } from 'react'
import Panel from '../Panel'
import ToolbarButton from '../ToolbarButton'
import Pagination from '../Pagination'
import Badge from '../Badge'
import {
  sgg,
  TournamentSummary,
  EventSummary,
  EntrantsPage,
  SetsPage,
  VideogameRef,
} from '../../api/startgg'

const DEFAULT_GAMES = ['Super Smash Bros. Ultimate', 'Street Fighter 6', 'Rocket League']
const POPULAR_GAMES = [
  ...DEFAULT_GAMES,
  'Valorant',
  'Fortnite',
  'Overwatch 2',
  'Mortal Kombat 1',
  'Tekken 8',
  'Rainbow Six Siege',
  'Guilty Gear Strive',
  'The King of Fighters XV',
]
const MIN_SEARCH_LENGTH = 3

const formatDate = (unix?: number | null) => {
  if (!unix) return 'TBA'
  const date = new Date((unix ?? 0) * 1000)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const formatLocale = (city?: string | null, country?: string | null) => {
  if (!city && !country) return 'Location TBD'
  if (city && country) return `${city}, ${country}`
  return city || country || 'Location TBD'
}

const normalizeError = (err: unknown) =>
  err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unexpected error'

export default function TournamentsBrowser() {
  const [gameInput, setGameInput] = useState('')
  const [resolvedGame, setResolvedGame] = useState<VideogameRef | null>(null)
  const [searchMatches, setSearchMatches] = useState<VideogameRef[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [selectedTournament, setSelectedTournament] = useState<TournamentSummary | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [entrantsPage, setEntrantsPage] = useState(1)
  const [setsPage, setSetsPage] = useState(1)
  const [entrantsData, setEntrantsData] = useState<EntrantsPage | null>(null)
  const [setsData, setSetsData] = useState<SetsPage | null>(null)

  const [gameLoading, setGameLoading] = useState(false)
  const [tournamentsLoading, setTournamentsLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [entrantsLoading, setEntrantsLoading] = useState(false)
  const [setsLoading, setSetsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetDrilldown = () => {
    setTournaments([])
    setSelectedTournament(null)
    setSelectedEventId(null)
    setEvents([])
    setEntrantsData(null)
    setSetsData(null)
    setEntrantsPage(1)
    setSetsPage(1)
  }

  const closeDetails = () => {
    setSelectedTournament(null)
    setSelectedEventId(null)
    setEvents([])
    setEntrantsData(null)
    setSetsData(null)
  }

  const normalizeGame = (game: VideogameRef): VideogameRef => ({
    id: String(game.id),
    name: game.name,
  })

  const applyResolvedGame = (game: VideogameRef) => {
    resetDrilldown()
    const normalized = normalizeGame(game)
    setResolvedGame(normalized)
    setGameInput(normalized.name)
  }

  const resolveGame = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a game name to search.')
      return
    }
    resetDrilldown()
    setResolvedGame(null)
    setGameInput(trimmed)
    setGameLoading(true)
    setError(null)
    try {
      const results = await sgg.videogames([trimmed])
      if (!results.length) {
        setError(`No game found for "${trimmed}".`)
        return
      }
      applyResolvedGame(results[0])
    } catch (err) {
      setResolvedGame(null)
      setError(normalizeError(err))
    } finally {
      setGameLoading(false)
    }
  }

  useEffect(() => {
    const term = gameInput.trim()
    if (term.length < MIN_SEARCH_LENGTH) {
      setSearchMatches([])
      setSuggestionsLoading(false)
      return
    }
    let active = true
    setSuggestionsLoading(true)
    const timer = setTimeout(() => {
      sgg
        .videogames([term])
        .then((matches) => {
          if (!active) return
          setSearchMatches(matches.map(normalizeGame))
        })
        .catch(() => {
          if (!active) return
          setSearchMatches([])
        })
        .finally(() => {
          if (active) setSuggestionsLoading(false)
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [gameInput])

  useEffect(() => {
    let active = true
    if (!resolvedGame) {
      setTournaments([])
      return () => {
        active = false
      }
    }
    async function loadTournaments() {
      setTournamentsLoading(true)
      setError(null)
      setSelectedTournament(null)
      setSelectedEventId(null)
      setEvents([])
      setEntrantsData(null)
      setSetsData(null)
      try {
        const list = await sgg.tournaments([resolvedGame.id], 'BR', 20)
        if (!active) return
        setTournaments(list)
      } catch (err) {
        if (!active) return
        setTournaments([])
        setError(normalizeError(err))
      } finally {
        if (active) setTournamentsLoading(false)
      }
    }
    loadTournaments()
    return () => {
      active = false
    }
  }, [resolvedGame])

  const prioritizedEvents = useMemo(() => {
    if (!events.length) return events
    if (!resolvedGame?.id) return events
    const primary = events.filter((ev) => String(ev.videogame?.id) === resolvedGame.id)
    const secondary = events.filter((ev) => String(ev.videogame?.id) !== resolvedGame.id)
    return [...primary, ...secondary]
  }, [events, resolvedGame?.id])

  const selectedEvent = useMemo(
    () => events.find((ev) => String(ev.id) === selectedEventId) || null,
    [events, selectedEventId],
  )

  const handleTournamentSelect = (tournament: TournamentSummary) => {
    setSelectedTournament(tournament)
    setSelectedEventId(null)
    setEntrantsPage(1)
    setSetsPage(1)
    setEntrantsData(null)
    setSetsData(null)
  }

  useEffect(() => {
    let active = true
    if (!selectedTournament) {
      setEvents([])
      setEventsLoading(false)
      return () => {
        active = false
      }
    }
    async function loadEvents() {
      setEventsLoading(true)
      setError(null)
      setEvents([])
      try {
        const list = await sgg.eventsByTournament(selectedTournament.slug)
        if (!active) return
        setEvents(list)
        const preferred =
          (resolvedGame && list.find((ev) => String(ev.videogame?.id) === resolvedGame.id)) ||
          list[0]
        setSelectedEventId(preferred ? String(preferred.id) : null)
        setEntrantsPage(1)
        setSetsPage(1)
      } catch (err) {
        if (!active) return
        setEvents([])
        setSelectedEventId(null)
        setEntrantsPage(1)
        setSetsPage(1)
        setError(normalizeError(err))
      } finally {
        if (active) setEventsLoading(false)
      }
    }
    loadEvents()
    return () => {
      active = false
    }
  }, [selectedTournament, resolvedGame?.id])

  useEffect(() => {
    let active = true
    if (!selectedEventId) {
      setEntrantsData(null)
      return () => {
        active = false
      }
    }
    async function loadEntrants() {
      setEntrantsLoading(true)
      setError(null)
      try {
        const payload = await sgg.eventEntrants(selectedEventId, entrantsPage, 25)
        if (!active) return
        setEntrantsData(payload)
      } catch (err) {
        if (!active) return
        setEntrantsData(null)
        setError(normalizeError(err))
      } finally {
        if (active) setEntrantsLoading(false)
      }
    }
    loadEntrants()
    return () => {
      active = false
    }
  }, [selectedEventId, entrantsPage])

  useEffect(() => {
    let active = true
    if (!selectedEventId) {
      setSetsData(null)
      return () => {
        active = false
      }
    }
    async function loadSets() {
      setSetsLoading(true)
      setError(null)
      try {
        const payload = await sgg.eventSets(selectedEventId, setsPage, 20)
        if (!active) return
        setSetsData(payload)
      } catch (err) {
        if (!active) return
        setSetsData(null)
        setError(normalizeError(err))
      } finally {
        if (active) setSetsLoading(false)
      }
    }
    loadSets()
    return () => {
      active = false
    }
  }, [selectedEventId, setsPage])

  useEffect(() => {
    if (!selectedTournament) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDetails()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedTournament])

  const quickPickMatches = useMemo(() => {
    const term = gameInput.trim().toLowerCase()
    if (!term) return DEFAULT_GAMES
    return POPULAR_GAMES.filter((game) => game.toLowerCase().includes(term)).slice(0, 6)
  }, [gameInput])

  const gameStatus = gameLoading
    ? 'Resolving game on Start.gg...'
    : resolvedGame
      ? `Browsing tournaments for ${resolvedGame.name}`
      : 'Search for a game or click one of the quick picks below.'

  const tournamentStatus = tournamentsLoading
    ? 'Loading tournaments...'
    : resolvedGame && !tournaments.length
      ? 'No upcoming Brazil tournaments found for this game.'
      : ''

  return (
    <div className="space-y-4">
      <Panel>
        <div className="p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold text-neutral-900">Pick a game to discover</div>
            <p className="text-xs text-neutral-600">
              Start.gg data stays on the server; you only see the curated results.
            </p>
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              resolveGame(gameInput || DEFAULT_GAMES[0])
            }}
          >
            <input
              type="text"
              value={gameInput}
              onChange={(event) => setGameInput(event.target.value)}
              placeholder='Try "League of Legends", "Counter-Strike 2"...'
              className="flex-1 rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none focus:ring"
            />
            <ToolbarButton
              onClick={(event) => {
                event.preventDefault()
                resolveGame(gameInput || DEFAULT_GAMES[0])
              }}
              className="px-4 py-2 text-sm"
              ariaLabel="Search game"
            >
              Search game
            </ToolbarButton>
          </form>

          {(gameInput.trim().length >= MIN_SEARCH_LENGTH || suggestionsLoading) && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Matching results
              </div>
              {suggestionsLoading ? (
                <div className="text-xs text-neutral-500">Loading suggestions...</div>
              ) : searchMatches.length ? (
                <div className="flex flex-wrap gap-2">
                  {searchMatches.slice(0, 6).map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => applyResolvedGame(game)}
                      className="rounded border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-800 transition hover:border-neutral-500"
                    >
                      {game.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500">
                  No direct matches yet — keep typing for better results.
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Quick picks
            </div>
            <div className="flex flex-wrap gap-2">
              {quickPickMatches.map((game) => (
                <button
                  key={game}
                  type="button"
                  onClick={() => resolveGame(game)}
                  className="rounded border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-800 transition hover:border-neutral-400"
                >
                  {game}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-neutral-600">{gameStatus}</div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      </Panel>

      {resolvedGame ? (
        <Panel>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-900">Upcoming tournaments</div>
                <p className="text-xs text-neutral-600">{resolvedGame.name} · Brazil</p>
              </div>
              <div className="text-xs text-neutral-600">{tournaments.length} results</div>
            </div>
            {tournamentStatus && (
              <div className="text-sm text-neutral-600">{tournamentStatus}</div>
            )}
            <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto pr-1">
              {tournaments.map((tournament) => {
                const active = selectedTournament?.id === tournament.id
                return (
                  <button
                    key={tournament.id}
                    type="button"
                    onClick={() => handleTournamentSelect(tournament)}
                    className={`rounded border px-3 py-2 text-left transition focus:outline-none focus-visible:ring ${active ? 'border-neutral-600 bg-white shadow' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{tournament.name}</div>
                        <div className="text-xs text-neutral-600">
                          {formatLocale(tournament.city, tournament.countryCode)}
                        </div>
                      </div>
                      <Badge>{formatDate(tournament.startAt)}</Badge>
                    </div>
                    <div className="mt-2 text-right text-xs text-blue-600">
                      {active ? 'Viewing…' : 'View details'}
                    </div>
                  </button>
                )
              })}
              {!tournaments.length && !tournamentsLoading && (
                <div className="rounded border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-500">
                  No tournaments yet. Try another game or widen your timeframe.
                </div>
              )}
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="p-4 text-sm text-neutral-600">Select a game to browse tournaments.</div>
        </Panel>
      )}

      {selectedTournament && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
            <div
              className="absolute inset-0 bg-black/60"
              aria-hidden="true"
              onClick={closeDetails}
            />
            <div className="relative z-10 w-full max-w-[960px]">
              <Panel className="flex max-h-[90vh] min-h-0 flex-col overflow-hidden">
                <div className="flex flex-1 flex-col min-h-0">
                  <div className="flex items-start justify-between border-b border-neutral-200 px-4 py-3">
                    <div>
                      <div className="text-lg font-semibold text-neutral-900">
                        {selectedTournament.name}
                      </div>
                      <div className="text-xs text-neutral-600">
                        {formatLocale(selectedTournament.city, selectedTournament.countryCode)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{formatDate(selectedTournament.startAt)}</Badge>
                      <button
                        type="button"
                        onClick={closeDetails}
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:border-neutral-500"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="border-b border-neutral-200 px-4 py-2 text-xs text-neutral-600">
                    <span className="mr-3">ID: {selectedTournament.id}</span>
                    <a
                      href={`https://www.start.gg/${selectedTournament.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open on Start.gg
                    </a>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">Events</div>
                          <p className="text-xs text-neutral-600">{selectedTournament.name}</p>
                        </div>
                        {eventsLoading && <span className="text-xs text-neutral-500">Loading...</span>}
                      </div>
                      {events.length === 0 && !eventsLoading && (
                        <div className="text-sm text-neutral-600">No events published yet.</div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {prioritizedEvents.map((ev) => {
                          const id = String(ev.id)
                          const active = id === selectedEventId
                          return (
                            <button
                              key={ev.id}
                              onClick={() => {
                                setSelectedEventId(id)
                                setEntrantsPage(1)
                                setSetsPage(1)
                              }}
                              className={`rounded px-3 py-1 text-sm focus:outline-none focus-visible:ring ${active ? 'bg-white font-semibold text-neutral-900 shadow' : 'bg-neutral-100 text-neutral-700 hover:bg-white'}`}
                            >
                              <span>{ev.name}</span>
                              {ev.videogame?.name && (
                                <span className="ml-2 text-[11px] uppercase text-neutral-500">
                                  {ev.videogame.name}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {selectedEventId ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <Panel>
                          <div className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-neutral-900">Entrants</div>
                                {selectedEvent && (
                                  <p className="text-xs text-neutral-600">{selectedEvent.name}</p>
                                )}
                              </div>
                              {entrantsLoading && (
                                <span className="text-xs text-neutral-500">Loading...</span>
                              )}
                            </div>
                            {entrantsData?.nodes?.length ? (
                              <ul className="divide-y divide-neutral-200 text-sm">
                                {entrantsData.nodes.map((entrant) => (
                                  <li
                                    key={entrant.id}
                                    className="flex items-center justify-between py-2"
                                  >
                                    <span className="font-medium text-neutral-900">{entrant.name}</span>
                                    <Badge>{entrant.id}</Badge>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-sm text-neutral-600">
                                {entrantsLoading ? 'Loading entrants...' : 'No entrants yet.'}
                              </div>
                            )}
                            {entrantsData && entrantsData.pageInfo.total > 0 && (
                              <Pagination
                                page={entrantsPage}
                                total={entrantsData.pageInfo.total}
                                pageSize={25}
                                onPage={(page) => setEntrantsPage(page)}
                              />
                            )}
                          </div>
                        </Panel>

                        <Panel>
                          <div className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-neutral-900">Sets</div>
                                {selectedEvent && (
                                  <p className="text-xs text-neutral-600">{selectedEvent.name}</p>
                                )}
                              </div>
                              {setsLoading && (
                                <span className="text-xs text-neutral-500">Loading...</span>
                              )}
                            </div>
                            {setsData?.nodes?.length ? (
                              <ul className="space-y-3 text-sm">
                                {setsData.nodes.map((set) => (
                                  <li
                                    key={set.id}
                                    className="rounded border border-neutral-200 bg-white/70 p-3"
                                  >
                                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                                      Round {set.round ?? '?'}
                                    </div>
                                    <div className="mt-1 font-semibold text-neutral-900">
                                      {set.slots
                                        ?.map((slot) => slot.entrant?.name)
                                        .filter(Boolean)
                                        .join(' vs ') || 'TBD'}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-sm text-neutral-600">
                                {setsLoading ? 'Loading sets...' : 'No sets published yet.'}
                              </div>
                            )}
                            {setsData && setsData.pageInfo.total > 0 && (
                              <Pagination
                                page={setsPage}
                                total={setsData.pageInfo.total}
                                pageSize={20}
                                onPage={(page) => setSetsPage(page)}
                              />
                            )}
                          </div>
                        </Panel>
                      </div>
                    ) : (
                      <Panel>
                        <div className="p-4 text-sm text-neutral-600">
                          Select an event above to see entrants and sets.
                        </div>
                      </Panel>
                    )}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
          </div> 
      )}
    </div>
  )
}
