import React from 'react'
type ToolbarButtonProps = React.PropsWithChildren<{
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  className?: string
  ariaLabel?: string
  as?: 'button' | 'span'
}>

export default function ToolbarButton({ children, onClick, className = '', ariaLabel, as = 'button' }: ToolbarButtonProps) {
  if (as === 'span') {
    return (
      <span
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onClick}
        onKeyDown={(event) => {
          if (!onClick) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick(event as unknown as React.MouseEvent<HTMLElement>)
          }
        }}
        className={`toolbar-btn ${className}`}
      >
        <span className="inline-flex items-center gap-1.5">{children}</span>
      </span>
    )
  }
  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={`toolbar-btn ${className}`}>
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </button>
  )
}
