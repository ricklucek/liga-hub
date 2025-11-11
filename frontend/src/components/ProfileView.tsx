import React, { useState } from 'react'
import Panel from './Panel'
import { useAuth } from '../context/AuthProvider'
import { AuthAPI } from '../api/auth'
import { FeedAPI } from '../api/feed'
import { ForumsAPI, ForumPost } from '../api/forums'
export default function ProfileView() {
  const { user, refetch } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [feedPosts, setFeedPosts] = useState<any[]>([])
  const [forumPosts, setForumPosts] = useState<Array<ForumPost & { thread?: any; replies?: ForumPost[] }>>([])
  const [forumError, setForumError] = useState('')

  if (!user) {
    return (
      <Panel>
        <div className="p-4 text-sm text-neutral-600">You must be logged in to view your profile.</div>
      </Panel>
    )
  }

  const handleFile = async (file?: File | null) => {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const reader = await new Promise<{ mime: string; base64: string }>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => {
          const result = r.result as string
          // result like data:<mime>;base64,<data>
          const parts = result.split(',')
          const mime = parts[0].split(':')[1].split(';')[0]
          resolve({ mime, base64: parts[1] })
        }
        r.onerror = () => reject(new Error('Failed to read file'))
        r.readAsDataURL(file)
      })

      await AuthAPI.updateAvatar({ imageBase64: reader.base64, imageMime: reader.mime, imageFilename: file.name })
      await refetch()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Load posts authored by this user
  React.useEffect(()=>{
    let active = true
    if (!user) return
    ;(async ()=>{
      try {
        const f = await FeedAPI.list({ authorId: user.id })
        if (!active) return
        setFeedPosts(f)
      } catch (e) {
        console.error('Failed to load feed posts for profile', e)
      }
      try {
        const r = await ForumsAPI.postsByUser(user.id)
        if (!active) return
        setForumPosts(r.posts as any)
      } catch (e: any) {
        console.error('Failed to load forum posts for profile', e)
        setForumError(e?.message || 'Failed to load forum posts')
      }
    })()
    return ()=>{ active = false }
  }, [user?.id, refetch])

  return (
    <div className="space-y-4">
      <Panel>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center text-xl font-bold text-neutral-700">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : <span>{(user.username||'U').slice(0,2).toUpperCase()}</span>}
            </div>
            <div>
              <div className="text-lg font-semibold">{user.username}</div>
              <div className="text-xs text-neutral-600">{user.email}</div>
              <div className="text-xs text-neutral-600">Since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</div>
              <div className="mt-1 text-xs">Role: {user.role === 'ORGANIZER' ? 'Organizer' : 'Player'}</div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Profile picture</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={(e)=>handleFile(e.target.files ? e.target.files[0] : null)} />
              <button className="toolbar-btn" onClick={()=>handleFile(undefined)} disabled>Choose</button>
              {uploading && <div className="text-sm text-neutral-500">Uploading…</div>}
            </div>
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="p-4">
          <div className="text-sm font-semibold">Feed posts</div>
          <div className="mt-3 space-y-3">
            {feedPosts.length===0 && <div className="text-xs text-neutral-500">No feed posts yet.</div>}
            {feedPosts.map(p=> (
              <div key={p.id} className="rounded border border-neutral-200 bg-neutral-50 p-3">
                <div className="text-sm font-medium">{p.author?.username}</div>
                <div className="text-xs text-neutral-600">{new Date(p.createdAt).toLocaleString()}</div>
                <div className="mt-2 text-sm whitespace-pre-wrap">{p.body}</div>
                {p.imageBase64 && <img src={`data:${p.imageMime};base64,${p.imageBase64}`} alt="post" className="mt-2 w-full rounded border" />}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="p-4">
          <div className="text-sm font-semibold">Forum posts</div>
          <div className="mt-3 space-y-3">
            {forumError && <div className="text-xs text-red-600">{forumError}</div>}
            {forumPosts.length===0 && !forumError && <div className="text-xs text-neutral-500">No forum posts yet.</div>}
            {forumPosts.map(p=> (
              <div key={p.id} className="rounded border border-neutral-200 bg-neutral-50 p-3">
                <div className="text-sm font-semibold">In thread: <a className="text-blue-600" href={`#/thread/${p.thread?.id}`}>{p.thread?.title}</a></div>
                <div className="text-xs text-neutral-600">{new Date(p.createdAt).toLocaleString()}</div>
                <div className="mt-2 text-sm whitespace-pre-wrap">{p.body}</div>
                {p.replies && p.replies.length>0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-semibold">Replies</div>
                    {p.replies.map(r => (
                      <div key={r.id} className="rounded border border-neutral-100 bg-white p-2">
                        <div className="text-xs font-medium">{r.author.username} • <span className="text-xs text-neutral-600">{new Date(r.createdAt).toLocaleString()}</span></div>
                        <div className="text-xs mt-1">{r.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}
