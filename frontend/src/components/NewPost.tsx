import React, { useState, useEffect, useRef } from 'react'
import ToolbarButton from './ToolbarButton'
import { useAuth } from '../context/AuthProvider'
import LoginPanel from './Auth/LoginPanel'
import RegisterPanel from './Auth/RegisterPanel'

type NewPostPayload = { text: string; imageBase64?: string | null; imageMime?: string | null; imageFilename?: string | null }

export default function NewPost({ onSubmit }:{ onSubmit:(payload:NewPostPayload)=>void }){
  const [value, setValue] = useState('')
  const { user } = useAuth()
  // authModal: null | 'login' | 'register'
  const [authModal, setAuthModal] = useState<null|'login'|'register'>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement|null>(null)

  // If user becomes authenticated and there is a pending post, submit it
  useEffect(() => {
    if (user && pending) {
      const text = pending.trim()
      if (text) {
        if (file) {
          const reader = new FileReader()
          reader.onload = () => {
            const result = String(reader.result || '')
            const parts = result.split(',')
            const base64 = parts[1] || ''
            onSubmit({ text, imageBase64: base64, imageMime: file.type || null, imageFilename: file.name })
          }
          reader.readAsDataURL(file)
        } else {
          onSubmit({ text })
        }
      }
      setPending(null)
      setValue('')
      setFile(null)
      setAuthModal(null)
    }
  }, [user, pending, file, onSubmit])

  const handleCreate = () => {
    if (!value.trim()) return
    if (!user) {
      // Save pending text and open auth modal
      setPending(value)
      setAuthModal('login')
      return
    }

    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = String(reader.result || '')
        const parts = result.split(',')
        const base64 = parts[1] || ''
        onSubmit({ text: value.trim(), imageBase64: base64, imageMime: file.type || null, imageFilename: file.name })
      }
      reader.readAsDataURL(file)
    } else {
      onSubmit({ text: value.trim() })
    }

    setValue('')
    setFile(null)
  }

  const handleAuthSuccess = () => {
    // no-op here; effect will handle pending submission
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e)=>setValue(e.target.value)}
        placeholder={"What's on your mind? Share a highlight or ask a question…"}
        rows={3}
        className="mt-1 w-full resize-y input-inset"
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e)=>{ setFile(e.target.files?.[0]||null) }} />
          <ToolbarButton as="span" onClick={() => { if (!fileInputRef.current) return; fileInputRef.current.click() }}>
            {file ? `Image: ${file.name}` : 'Upload image'}
          </ToolbarButton>
          {file && <span className="text-xs text-neutral-600">{file.name}</span>}
        </div>
        <ToolbarButton onClick={handleCreate}>{user ? 'Create Post' : 'Post — sign in to publish'}</ToolbarButton>
      </div>

      {authModal === 'login' && (
        <LoginPanel
          onClose={() => setAuthModal(null)}
          onSwitchToRegister={() => setAuthModal('register')}
          onSuccess={handleAuthSuccess}
        />
      )}

      {authModal === 'register' && (
        <RegisterPanel
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={() => setAuthModal('login')}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}
