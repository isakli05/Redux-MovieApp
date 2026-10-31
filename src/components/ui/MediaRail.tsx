import { Children, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { SectionHeader } from './SectionHeader'

export interface MediaRailProps {
  title: string
  eyebrow?: string
  linkTo?: string
  linkLabel?: string
  /** PosterCards (or any tiles); each child is wrapped in a snap-start list item. */
  children: ReactNode
  className?: string
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

const chevronClasses =
  'absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong text-secondary backdrop-blur-md transition-colors duration-150 ease-cine hover:border-accent hover:text-accent bg-surface-glass md:flex'

/**
 * Horizontal scroll-snap rail with SectionHeader, desktop chevrons (scroll by
 * 80% of the rail width) and edge fades. No Swiper (spec §5). Negative
 * gutters make the rail bleed to the viewport edge inside pages that use the
 * spec gutters (px-4 sm:px-6 lg:px-8).
 */
export function MediaRail({
  title,
  eyebrow,
  linkTo,
  linkLabel,
  children,
  className = '',
}: MediaRailProps) {
  const listRef = useRef<HTMLUListElement>(null)

  const scrollRail = useCallback((direction: 1 | -1) => {
    const list = listRef.current
    if (!list) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [])

  return (
    <section className={className}>
      <SectionHeader title={title} eyebrow={eyebrow} linkTo={linkTo} linkLabel={linkLabel} />

      <div className="relative">
        <ul
          ref={listRef}
          role="list"
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {Children.map(children, (child, index) => (
            <li key={index} className="shrink-0 snap-start">
              {child}
            </li>
          ))}
        </ul>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r from-surface-void to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l from-surface-void to-transparent"
        />

        <button type="button" aria-label="Önceki" onClick={() => scrollRail(-1)} className={chevronClasses + ' left-2'}>
          <ChevronIcon direction="left" />
        </button>
        <button type="button" aria-label="Sonraki" onClick={() => scrollRail(1)} className={chevronClasses + ' right-2'}>
          <ChevronIcon direction="right" />
        </button>
      </div>
    </section>
  )
}
