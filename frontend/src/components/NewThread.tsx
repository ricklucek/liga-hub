import React, { useState } from 'react'
import ToolbarButton from './ToolbarButton'
export default function NewThread({ onSubmit }:{ onSubmit:(title:string)=>void }){
  const [title, setTitle] = useState('')
  return (
    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Start a new thread (e.g., '[League] Team A vs Team B — 19:00')" className="input-inset"/>
      <ToolbarButton onClick={()=>{ onSubmit(title); setTitle('') }}>Create Thread</ToolbarButton>
    </div>
  )
}
