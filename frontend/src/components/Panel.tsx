import React from 'react'
export default function Panel({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`panel ${className}`}>{children}</div>
}
