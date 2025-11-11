import React, { useEffect, useMemo, useState } from 'react'
import Panel from '../Panel'
import Badge from '../Badge'
import { sgg, TournamentSummary, EventSummary, VideogameRef } from '../../api/startgg'
import { LEAGUE_RECOMMENDED } from '../../data/leagueGames'

const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth()+1, 0)
}

export default function CalendarView(){
  const DEFAULT_GAMES = LEAGUE_RECOMMENDED
  const [gameInput, setGameInput] = useState('')
  const [resolvedGame, setResolvedGame] = useState<VideogameRef | null>(null)
    const [searchMatches, setSearchMatches] = useState<VideogameRef[]>([])
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)
    const [gameLoading, setGameLoading] = useState(false)
    const [selectedGames, setSelectedGames] = useState<VideogameRef[]>([])
    const [assignedGames, setAssignedGames] = useState<Record<string, VideogameRef>>({})
  const [cursor, setCursor] = useState(() => new Date())
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<TournamentSummary | null>(null)
  const [events, setEvents] = useState<EventSummary[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  const first = useMemo(()=>startOfMonth(cursor), [cursor])
  const last = useMemo(()=>endOfMonth(cursor), [cursor])

  useEffect(()=>{
    let active = true
    setLoading(true)
    setError(null)
      // fetch tournaments for selected games (if any). If none selected, clear list.
      const videogameIds = selectedGames.length ? selectedGames.map(g=>g.id) : []
      if (!videogameIds.length) {
        setTournaments([])
        setLoading(false)
        return () => { active = false }
      }
      // fetch many tournaments and filter client-side by month
    sgg.tournaments(videogameIds, 'BR', 200)
      .then(list => {
        if (!active) return
        setTournaments(list)
      })
      .catch(err => {
        if (!active) return
        setError(String(err))
        setTournaments([])
      })
      .finally(()=>{ if (active) setLoading(false) })
    return ()=>{ active = false }
  }, [monthKey(cursor), JSON.stringify(selectedGames.map(g=>g.id))])

  // videogame suggestions
  useEffect(() => {
    const term = gameInput.trim()
    if (term.length < 2) {
      setSearchMatches([])
      setSuggestionsLoading(false)
      return
    }
    let active = true
    setSuggestionsLoading(true)
    const timer = setTimeout(() => {
      sgg.videogames([term])
        .then(matches => { if (!active) return; setSearchMatches(matches) })
        .catch(()=> { if (!active) return; setSearchMatches([]) })
        .finally(()=> { if (active) setSuggestionsLoading(false) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [gameInput])

  const byDate = useMemo(()=>{
    const map = new Map<string, TournamentSummary[]>()
    tournaments.forEach(t => {
      if (!t.startAt) return
      const d = new Date((t.startAt||0)*1000)
      // only include tournaments that overlap the month
      if (d < first || d > last) return
      const key = d.toISOString().slice(0,10)
      const arr = map.get(key) || []
      arr.push(t)
      map.set(key, arr)
    })
    return map
  }, [tournaments, first, last])

  const weeks = useMemo(()=>{
    const startDay = new Date(first)
    startDay.setDate(1 - startDay.getDay()) // go back to Sunday
    const weeksArr: Date[][] = []
    for (let w=0; w<6; w++){
      const week: Date[] = []
      for (let d=0; d<7; d++){
        const cur = new Date(startDay)
        cur.setDate(startDay.getDate() + w*7 + d)
        week.push(cur)
      }
      weeksArr.push(week)
    }
    return weeksArr
  }, [first])

  const openDetails = (t: TournamentSummary) => {
    setSelected(t)
    setEvents([])
    setEventsLoading(true)
    sgg.eventsByTournament(t.slug)
      .then(list => setEvents(list))
      .catch(()=>setEvents([]))
      .finally(()=>setEventsLoading(false))
  }

  const resolveGame = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setGameLoading(true)
    try {
      const results = await sgg.videogames([trimmed])
      if (!results.length) return
      setResolvedGame(results[0])
      setGameInput(results[0].name)
      // add to selected games so the calendar will show tournaments for it
      setSelectedGames(prev => prev.some(p => p.id === results[0].id) ? prev : [...prev, results[0]])
      setSearchMatches([])
    } catch (e) {
      // ignore
    } finally { setGameLoading(false) }
  }

  const assignGameToTournament = (tournamentId: string, game: VideogameRef) => {
    setAssignedGames(prev => ({ ...prev, [tournamentId]: game }))
  }

  const addSelectedGame = (g: VideogameRef) => {
    setSelectedGames(prev => prev.some(p => p.id === g.id) ? prev : [...prev, g])
    setGameInput('')
    setSearchMatches([])
  }

  const removeSelectedGame = (id: string) => {
    setSelectedGames(prev => prev.filter(g => g.id !== id))
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-900">Calendar</div>
              <div className="text-xs text-neutral-600">Browse upcoming tournaments by date</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="toolbar-btn" onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1, 1))}>Prev</button>
              <div className="text-sm font-medium">{cursor.toLocaleString(undefined,{ month:'long', year:'numeric' })}</div>
              <button className="toolbar-btn" onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1, 1))}>Next</button>
            </div>
          </div>
        </div>
      </Panel>
      
        <Panel>
          <div className="p-4">
            <div className="text-sm font-semibold">Games</div>
            <div className="mt-2 mb-2 flex items-center gap-2">
              <input value={gameInput} onChange={(e)=>setGameInput(e.target.value)} placeholder="Search videogame…" className="input-inset text-sm" />
              <button className="toolbar-btn" onClick={(e)=>{ e.preventDefault(); resolveGame(gameInput) }}>{gameLoading ? 'Searching…' : 'Add'}</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedGames.length===0 ? <div className="text-xs text-neutral-500">No games selected. Add one to show tournaments.</div> : selectedGames.map(g=> (
                <div key={g.id} className="flex items-center gap-2 rounded border px-2 py-1 text-xs bg-white">
                  <div className="text-sm">{g.name}</div>
                  <button onClick={()=>removeSelectedGame(g.id)} className="ml-2 text-xs text-red-600">×</button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestionsLoading ? <div className="text-xs text-neutral-500">Loading…</div> : searchMatches.slice(0,6).map(g => (
                <button key={g.id} className="rounded border px-2 py-1 text-xs" onClick={()=>addSelectedGame(g)}>{g.name}</button>
              ))}
              {DEFAULT_GAMES.map(g => (
                <button key={g} className="rounded border px-2 py-1 text-xs" onClick={()=>resolveGame(g)}>{g}</button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 text-xs text-neutral-600 mb-2">
            {dayNames.map(d=> <div key={d} className="text-center font-medium">{d}</div>)}
          </div>
          <div className="grid grid-rows-6 gap-1">
            {weeks.map((week, wi)=> (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day)=>{
                  const iso = day.toISOString().slice(0,10)
                  const items = byDate.get(iso) || []
                  const inMonth = day.getMonth() === first.getMonth()
                  return (
                    <div key={iso} className={`min-h-[88px] rounded border ${inMonth ? 'bg-white' : 'bg-neutral-50 text-neutral-400'} p-2 text-xs`}> 
                      <div className="mb-1 flex items-center justify-between">
                        <div className="font-semibold">{day.getDate()}</div>
                        {items.length>0 && <Badge>{items.length}</Badge>}
                      </div>
                      <div className="space-y-1 overflow-hidden">
                            {items.slice(0,3).map(it=> (
                              <div key={it.id} className="flex items-center gap-2">
                                <button onClick={()=>openDetails(it)} className="block w-full text-left truncate rounded px-1 py-0.5 text-[12px] bg-neutral-100 hover:bg-neutral-200">{it.name}</button>
                                {assignedGames[it.id] && <div className="text-[11px] text-neutral-600">{assignedGames[it.id].name}</div>}
                              </div>
                            ))}
                        {items.length>3 && <div className="text-[11px] text-neutral-500">+{items.length-3} more</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {loading && <div className="mt-2 text-sm text-neutral-500">Loading tournaments…</div>}
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-black/60" aria-hidden onClick={()=>setSelected(null)} />
            <div className="relative z-10 w-full max-w-[720px]">
              <Panel>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold text-neutral-900">{selected.name}</div>
                      <div className="text-xs text-neutral-600">{selected.city || ''} • {selected.countryCode || ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{selected.startAt ? new Date(selected.startAt*1000).toLocaleDateString() : 'TBA'}</Badge>
                      <button className="toolbar-btn" onClick={()=>setSelected(null)}>Close</button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-neutral-700">
                    <div>ID: {selected.id}</div>
                    <a className="text-blue-600 hover:underline" href={`https://www.start.gg/${selected.slug}`} target="_blank" rel="noreferrer">Open on Start.gg</a>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-semibold">Events</div>
                    {eventsLoading && <div className="text-sm text-neutral-500">Loading events…</div>}
                    {!eventsLoading && events.length===0 && <div className="text-sm text-neutral-600">No events available.</div>}
                    <div className="space-y-2">
                      {events.map(ev => (
                        <div key={ev.id} className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm">
                          <div className="font-medium">{ev.name}</div>
                          <div className="text-xs text-neutral-600">{ev.videogame?.name || ''}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-semibold">Assign game</div>
                      <div className="mt-2 flex gap-2 items-center">
                        <input value={gameInput} onChange={(e)=>setGameInput(e.target.value)} placeholder="Search videogame…" className="input-inset text-sm" />
                        <button className="toolbar-btn" onClick={(e)=>{ e.preventDefault(); resolveGame(gameInput) }}>{gameLoading ? 'Searching…' : 'Find'}</button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {suggestionsLoading ? <div className="text-xs text-neutral-500">Loading…</div> : searchMatches.slice(0,6).map(g => (
                          <button key={g.id} className="rounded border px-2 py-1 text-xs" onClick={()=>assignGameToTournament(selected.id, g)}>{g.name}</button>
                        ))}
                        {DEFAULT_GAMES.map(g => (
                          <button key={g} className="rounded border px-2 py-1 text-xs" onClick={()=>resolveGame(g)}>{g}</button>
                        ))}
                      </div>
                      {assignedGames[selected.id] && <div className="mt-2 text-xs text-neutral-700">Assigned: <strong>{assignedGames[selected.id].name}</strong></div>}
                    </div>
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
