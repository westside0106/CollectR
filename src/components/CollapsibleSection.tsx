'use client'

import { useState, ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  headerExtra?: ReactNode
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  className = '',
  headerExtra,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl card-padding shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {headerExtra}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-3 sm:mt-4">{children}</div>}
    </div>
  )
}
