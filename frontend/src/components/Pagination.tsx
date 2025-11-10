import React from 'react'
export default function Pagination({ page, total, pageSize, onPage }:{ page:number; total:number; pageSize:number; onPage:(p:number)=>void }){
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <nav className="mt-2 flex items-center gap-1" aria-label="Pagination">
      {Array.from({ length: pages }).map((_, i) => {
        const p = i + 1
        const active = p === page
        return (
          <button key={p} onClick={()=>onPage(p)} className={`min-w-[2rem] rounded border px-2 py-1 text-xs ${active ? 'border-neutral-500 bg-white text-neutral-900' : 'border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{p}</button>
        )
      })}
    </nav>
  )
}
