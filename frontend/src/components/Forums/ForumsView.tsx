import React, { useState, useEffect } from 'react'
import Panel from '../Panel'
import NewThread from '../NewThread'
import Separator from '../Separator'
import Pagination from '../Pagination'
import ReplyBox from '../ReplyBox'
import { useAuth } from '../../context/AuthProvider'
import { ForumsAPI, AdminAPI, type ForumCategory, type ForumThread, type ThreadWithPosts } from '../../api/forums'
import LoginPanel from '../Auth/LoginPanel'
import RegisterPanel from '../Auth/RegisterPanel'

interface ForumsViewProps {
  forumSort: 'hot' | 'new' | 'top'
}

export default function ForumsView({ forumSort }: ForumsViewProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [activeThread, setActiveThread] = useState<ThreadWithPosts | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const pageSize = 20

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Load threads when category or sort changes
  useEffect(() => {
    loadThreads()
  }, [activeCategory, forumSort, page])

  const loadCategories = async () => {
    try {
      const cats = await ForumsAPI.categories()
      setCategories(cats)
      if (cats.length > 0 && activeCategory === null) {
        setActiveCategory(cats[0].id)
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadThreads = async () => {
    if (activeCategory === null) return

    setLoading(true)
    try {
      const response = await ForumsAPI.listThreads({
        categoryId: activeCategory,
        sort: forumSort,
        page,
        pageSize,
      })
      setThreads(response.threads)
      setTotalPages(response.pagination.totalPages)
    } catch (err) {
      console.error('Failed to load threads:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadThread = async (threadId: number) => {
    try {
      const thread = await ForumsAPI.getThread(threadId)
      setActiveThread(thread)
    } catch (err) {
      console.error('Failed to load thread:', err)
    }
  }

  const handleCreateThread = async (title: string) => {
    if (!user) {
      setShowLogin(true)
      return
    }

    if (!activeCategory || !title.trim()) return

    try {
      await ForumsAPI.createThread({
        categoryId: activeCategory,
        title: title.trim(),
      })
      await loadThreads()
      setPage(1)
    } catch (err: any) {
      alert(err.message || 'Failed to create thread')
    }
  }

  const handleReply = async (body: string) => {
    if (!user) {
      setShowLogin(true)
      return
    }

    if (!activeThread || !body.trim()) return

    try {
      await ForumsAPI.reply(activeThread.id, { body: body.trim() })
      await loadThread(activeThread.id)
    } catch (err: any) {
      alert(err.message || 'Failed to post reply')
    }
  }

  const handleVote = async (threadId: number, value: -1 | 1) => {
    if (!user) {
      setShowLogin(true)
      return
    }

    try {
      await ForumsAPI.vote(threadId, value)
      if (activeThread && activeThread.id === threadId) {
        await loadThread(threadId)
      }
      await loadThreads()
    } catch (err: any) {
      console.error('Vote failed:', err)
    }
  }

  const handlePinThread = async (threadId: number) => {
    try {
      await AdminAPI.pinThread(threadId)
      await loadThreads()
      if (activeThread && activeThread.id === threadId) {
        await loadThread(threadId)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to pin thread')
    }
  }

  const handleLockThread = async (threadId: number) => {
    try {
      await AdminAPI.lockThread(threadId)
      await loadThreads()
      if (activeThread && activeThread.id === threadId) {
        await loadThread(threadId)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to lock thread')
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Delete this post?')) return

    try {
      await AdminAPI.deletePost(postId)
      if (activeThread) {
        await loadThread(activeThread.id)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete post')
    }
  }

  const isModerator = user && (user.role === 'MOD' || user.role === 'ADMIN')

  return (
    <>
      <Panel>
        <div className="p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCategory(c.id)
                  setActiveThread(null)
                  setPage(1)
                }}
                className={`rounded border px-2 py-1 text-xs ${
                  activeCategory === c.id
                    ? 'border-neutral-400 bg-white text-neutral-900'
                    : 'border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <NewThread onSubmit={handleCreateThread} />
        </div>
      </Panel>

      <Panel>
        <div className="p-3">
          <div className="mb-2 text-sm font-semibold">
            {loading ? 'Loading threads...' : 'Threads'}
          </div>
          <Separator />
          <ul className="divide-y divide-neutral-300 text-sm">
            {threads.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-2 odd:bg-neutral-50"
              >
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleVote(t.id, 1)}
                    className="text-neutral-500 hover:text-green-600"
                    disabled={!user}
                    title="Upvote"
                  >
                    ▲
                  </button>
                  <span className="text-xs font-semibold">{t.voteScore || 0}</span>
                  <button
                    onClick={() => handleVote(t.id, -1)}
                    className="text-neutral-500 hover:text-red-600"
                    disabled={!user}
                    title="Downvote"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {t.isPinned && <span className="badge">Pinned</span>}
                    {t.isLocked && <span className="badge">Locked</span>}
                    <button
                      className="truncate text-left hover:underline"
                      onClick={() => loadThread(t.id)}
                    >
                      {t.title}
                    </button>
                  </div>
                  <div className="text-xs text-neutral-600">
                    by {t.author.username} • {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="text-neutral-600">{t.postCount || 0} replies</span>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={threads.length} pageSize={pageSize} onPage={setPage} />
        </div>
      </Panel>

      {activeThread && (
        <Panel>
          <div className="p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold">{activeThread.title}</h3>
                {activeThread.body && (
                  <p className="mt-1 text-sm text-neutral-700">{activeThread.body}</p>
                )}
              </div>
              {isModerator && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePinThread(activeThread.id)}
                    className="toolbar-btn text-xs"
                  >
                    {activeThread.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handleLockThread(activeThread.id)}
                    className="toolbar-btn text-xs"
                  >
                    {activeThread.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-3 py-2">
              {activeThread.posts.map((p) => (
                <div
                  key={p.id}
                  className="rounded border border-neutral-300 bg-neutral-50 p-2"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-xs text-neutral-600">
                      {p.author.username} • {new Date(p.createdAt).toLocaleString()}
                      {p.author.role && p.author.role !== 'USER' && (
                        <span className="ml-2 badge">{p.author.role}</span>
                      )}
                    </div>
                    {isModerator && (
                      <button
                        onClick={() => handleDeletePost(p.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-900">
                    {p.body}
                  </p>
                </div>
              ))}
              {!activeThread.isLocked && <ReplyBox onSubmit={handleReply} />}
              {activeThread.isLocked && (
                <div className="text-center text-sm text-neutral-600">
                  This thread is locked. No new replies allowed.
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {showLogin && (
        <LoginPanel
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
        />
      )}

      {showRegister && (
        <RegisterPanel
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
        />
      )}
    </>
  )
}
