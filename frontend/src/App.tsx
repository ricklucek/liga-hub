import React, { useMemo, useRef, useState } from 'react'
import Panel from './components/Panel'
import ToolbarButton from './components/ToolbarButton'
import Tab from './components/Tab'
import Separator from './components/Separator'
import Badge from './components/Badge'
import Lightbox from './components/Lightbox'
import Pagination from './components/Pagination'
import NewPost from './components/NewPost'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { seedPosts } from './data/seed'
import { filterPostsBySearch, paginate } from './utils/filters'
import ForumsView from './components/Forums/ForumsView'

const LazyUserMenu = React.lazy(() => import('./components/UserMenu'))
const LazyTournamentsBrowser = React.lazy(() => import('./components/Discover/TournamentsBrowser'))

const LOGO_URL = '/ligahub-logo.png'

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed'|'leagues'|'teams'|'calendar'|'forums'|'profile'>('feed')
  const [search, setSearch] = useState('')
  const [compact, setCompact] = useState(true)
  const [forumSort, setForumSort] = useState<'hot'|'new'|'top'>('hot')
  const [lightboxUrl, setLightboxUrl] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  useKeyboardShortcuts({
    focusSearch: () => searchRef.current?.focus(),
    gotoFeed: () => setActiveTab('feed'),
    gotoForums: () => setActiveTab('forums'),
    toggleHelp: () => setShowHelp((v)=>!v),
  })

  const [posts, setPosts] = useState(seedPosts)

  function addPost(text: string) {
    if (!text.trim()) return
    setPosts([{ id: `p${Date.now()}`, author: 'Você', avatar: 'VC', body: text.trim(), image: null, likes: 0, comments: 0, createdAt: new Date().toISOString() }, ...posts])
  }

  const filteredPosts = useMemo(() => filterPostsBySearch(posts, search), [posts, search])

  const [page, setPage] = useState(1)

  return (
    <div className={`min-h-screen bg-neutral-100 text-neutral-900 ${compact ? 'text-[14px]' : 'text-base'}`}>
      {/* Top Chrome */}
      <div className="border-b border-neutral-300 bg-gradient-to-b from-white to-neutral-200 shadow-[0_1px_0_rgba(255,255,255,.8),0_2px_6px_rgba(0,0,0,.06)]">
        <div className="mx-auto flex max-w-[1024px] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="logo-wrap">
              <img src={LOGO_URL} alt="LigaHub" className="h-14 md:h-20 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-3 text-sm shrink-0">
              {[['feed','Feed'],['leagues','Leagues'],['teams','Teams'],['calendar','Calendar'],['forums','Forums'],['profile','Profile']].map(([id, label]) => (
                <button key={id} onClick={()=>setActiveTab(id as any)} className={`rounded px-2 py-1 ${activeTab===id ? 'bg-white border border-neutral-300 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]' : 'hover:bg-white/70'}`}>{label}</button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <input ref={searchRef} value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search…" aria-label="Search" className="input-inset min-w-0 w-full max-w-[220px] md:max-w-[320px]" />
            <button className="toolbar-btn">Search</button>
            <div className="ml-2 shrink-0">
              <React.Suspense fallback={<button className="toolbar-btn">User</button>}>
                <LazyUserMenu />
              </React.Suspense>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1024px] px-4">
          {activeTab === 'forums' ? (
            <div className="flex items-end gap-2 border-b border-neutral-300">
              <Tab active={forumSort==='hot'} onClick={()=>setForumSort('hot')}>Hot</Tab>
              <Tab active={forumSort==='new'} onClick={()=>setForumSort('new')}>New</Tab>
              <Tab active={forumSort==='top'} onClick={()=>setForumSort('top')}>Top</Tab>
            </div>
          ) : (
            <div className="h-[1px] bg-neutral-300" />
          )}
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto grid max-w-[1024px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
        {/* Left */}
        <section className="space-y-4 lg:col-span-8">
          {activeTab === 'feed' && (
            <>
              <Panel>
                <div className="p-3">
                  <div className="mb-2 text-sm font-semibold">Share with the community</div>
                  <NewPost onSubmit={addPost} />
                </div>
              </Panel>
              {filteredPosts.map(p => (
                <Panel key={p.id}>
                  <div className="flex items-start gap-3 p-3">
                    <div className="grid h-10 w-10 place-items-center rounded border border-neutral-400 bg-neutral-100 text-xs font-bold text-neutral-700">{p.avatar}</div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2 text-xs text-neutral-600">
                        <span className="font-medium text-neutral-800">{p.author}</span>
                        <span>•</span>
                        <span>{new Date(p.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-900">{p.body}</p>
                      {p.image && (<img src={p.image!} alt="post" className="mt-2 w-full rounded border border-neutral-300" onClick={()=>setLightboxUrl(p.image || '')} />)}
                      <div className="mt-2 flex items-center gap-3 text-xs text-neutral-700">
                        <button className="rounded border border-neutral-300 bg-neutral-100 px-2 py-1 hover:bg-neutral-200">♥ {p.likes}</button>
                        <Badge>{p.comments} comments</Badge>
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </>
          )}

          {activeTab === 'forums' && (
            <ForumsView forumSort={forumSort} />
          )}

          {activeTab === 'leagues' && (
            <>
              <Panel>
                <div className="p-3">
                  <div className="mb-2 text-sm font-semibold">Leagues / Discover</div>
                  <div className="text-sm text-neutral-700">Browse tournaments and events</div>
                </div>
              </Panel>
              <div className="">
                {/* TournamentsBrowser will live here */}
                <React.Suspense fallback={<div className="p-3">Loading…</div>}>
                  <LazyTournamentsBrowser />
                </React.Suspense>
              </div>
            </>
          )}
          {activeTab !== 'feed' && activeTab !== 'forums' && activeTab !== 'leagues' && (
            <Panel><div className="p-3 text-sm text-neutral-700">This tab is part of the MVP shell. Wire up later.</div></Panel>
          )}
        </section>

        {/* Right */}
        <aside className="space-y-4 lg:col-span-4">
          <Panel>
            <div className="p-3">
              <div className="text-sm font-semibold">Trending Topics</div>
              <div className="mt-2 flex flex-wrap gap-2">{['League of Legends','Counter‑Strike 2','Dota 2','Basquete Universitário'].map(t => (<span key={t} className="badge">{t}</span>))}</div>
            </div>
          </Panel>
          <Panel>
            <div className="p-3">
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="mt-2 grid gap-2">{['Browse Tournaments','Find Teams','View Calendar','Join Discussions'].map(a => (<button key={a} className="rounded border border-neutral-400 bg-neutral-100 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-200">{a}</button>))}</div>
            </div>
          </Panel>
          <Panel>
            <div className="p-3">
              <div className="text-sm font-semibold">Active Leagues</div>
              <ul className="mt-2 space-y-2 text-sm text-neutral-800">
                <li className="flex items-center justify-between rounded border border-neutral-300 bg-neutral-50 p-2"><div><div className="font-medium">Pro Esports League</div><div className="text-xs text-neutral-600">64 teams competing</div></div><span className="badge">View</span></li>
                <li className="flex items-center justify-between rounded border border-neutral-300 bg-neutral-50 p-2"><div><div className="font-medium">City Basketball</div><div className="text-xs text-neutral-600">32 teams competing</div></div><span className="badge">View</span></li>
              </ul>
            </div>
          </Panel>
        </aside>
      </main>

      <footer className="border-t border-neutral-300 bg-gradient-to-b from-white to-neutral-200">
        <div className="mx-auto flex max-w-[1024px] items-center justify-between px-4 py-2 text-xs text-neutral-700">
          <div>Connected • 64 teams online • v0.1</div>
          <div>Shortcuts: / search · g f feed · g o forums · ? help</div>
        </div>
      </footer>

      <Lightbox url={lightboxUrl} onClose={()=>setLightboxUrl('')} />

      {showHelp && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" role="dialog" aria-modal>
          <Panel>
            <div className="w-[520px] p-4">
              <div className="mb-2 text-lg font-semibold">Keyboard shortcuts</div>
              <ul className="list-disc pl-5 text-sm text-neutral-800">
                <li><kbd className="rounded border border-neutral-400 bg-neutral-100 px-1">/</kbd> Focus search</li>
                <li><kbd className="rounded border border-neutral-400 bg-neutral-100 px-1">g</kbd> then <kbd className="rounded border border-neutral-400 bg-neutral-100 px-1">f</kbd> Go to Feed</li>
                <li><kbd className="rounded border border-neutral-400 bg-neutral-100 px-1">g</kbd> then <kbd className="rounded border border-neutral-400 bg-neutral-100 px-1">o</kbd> Go to Forums</li>
                <li><kbd className="rounded border border-neutral-400 bg-neutral-100 px-1">?</kbd> Toggle this help</li>
              </ul>
              <div className="mt-3 text-right"><button className="toolbar-btn" onClick={()=>setShowHelp(false)}>Close</button></div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
