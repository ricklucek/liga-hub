import React from 'react'
export default function Lightbox({ url, onClose }:{ url:string; onClose:()=>void }){
  if(!url) return null
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 grid place-items-center bg-black/80" onClick={onClose}>
      <img src={url} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded shadow-2xl" onClick={(e)=>e.stopPropagation()} />
      <button className="absolute right-6 top-6 rounded bg-white/90 px-3 py-1 text-sm text-neutral-900" onClick={onClose}>Close</button>
    </div>
  )
}
