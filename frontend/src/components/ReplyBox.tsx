import React, { useState } from 'react'
import ToolbarButton from './ToolbarButton'
export default function ReplyBox({ onSubmit }:{ onSubmit:(body:string)=>void }){
  const [value, setValue] = useState('')
  return (
    <div>
      <textarea value={value} onChange={(e)=>setValue(e.target.value)} placeholder="Write a reply…" rows={3} className="mt-1 w-full resize-y input-inset"/>
      <div className="mt-2 text-right">
        <ToolbarButton onClick={()=>{ onSubmit(value); setValue('') }}>Reply</ToolbarButton>
      </div>
    </div>
  )
}
