import React, { useState } from 'react'
import ToolbarButton from './ToolbarButton'
export default function NewPost({ onSubmit }:{ onSubmit:(text:string)=>void }){
  const [value, setValue] = useState('')
  return (
    <div>
      <textarea value={value} onChange={(e)=>setValue(e.target.value)} placeholder="What's on your mind? Share a highlight or ask a question…" rows={3} className="mt-1 w-full resize-y input-inset"/>
      <div className="mt-2 flex items-center justify-between">
        <ToolbarButton>Upload image</ToolbarButton>
        <ToolbarButton onClick={()=>{onSubmit(value); setValue('')}}>Create Post</ToolbarButton>
      </div>
    </div>
  )
}
