import React from 'react'
export default function Tab({ active, children, onClick }:
  React.PropsWithChildren<{ active?: boolean; onClick?: () => void }>) {
  return (
    <button onClick={onClick} role="tab" aria-selected={!!active} className={active ? 'tab-active' : 'tab'}>
      {children}
    </button>
  )
}
