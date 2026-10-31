import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
}

export interface TabsProps {
  tabs: TabItem[]
  /** Controlled active tab id. */
  activeId: string
  onChange: (id: string) => void
  /** Active panel content — the parent renders content for `activeId`. */
  children?: ReactNode
  'aria-label'?: string
  className?: string
}

/**
 * Underline tabs with a gold active indicator (spec §5). Roving tabindex with
 * ArrowLeft/ArrowRight/Home/End; selection follows focus. The panel re-mounts
 * per tab so motion-safe:animate-fade-in replays on change.
 */
export function Tabs({
  tabs,
  activeId,
  onChange,
  children,
  className = '',
  'aria-label': ariaLabel,
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const focusTabAt = (index: number) => {
    const tab = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]
    tab?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    onChange(tabs[nextIndex].id)
    focusTabAt(nextIndex)
  }

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-150 ease-cine after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors after:duration-150 ${
                active ? 'text-accent after:bg-accent' : 'text-secondary hover:text-primary after:bg-transparent'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        key={activeId}
        role="tabpanel"
        id={`tabpanel-${activeId}`}
        aria-labelledby={`tab-${activeId}`}
        tabIndex={0}
        className="pt-6 motion-safe:animate-fade-in"
      >
        {children}
      </div>
    </div>
  )
}
