import { Children, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SectionHeader } from './SectionHeader'

export interface MediaRailProps {
  title: string
  eyebrow?: string
  linkTo?: string
  linkLabel?: string
  /** PosterCards (or any tiles); each child is wrapped in a snap-start list item. */
  children: ReactNode
  /** Rail background tone for the edge fades (default surface-void). */
  fadeTone?: 'surface-void' | 'surface-base'
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
 * 80% of the rail width) and directional edge fades. Fades appear only on the
 * side where more content exists, so a resting rail never fogs its first card
 * and a clipped card always reads as "scroll this way". No Swiper (spec §5).
 * Negative gutters make the rail bleed to the viewport edge inside pages that
 * use the spec gutters (px-4 sm:px-6 lg:px-8).
 */
export function MediaRail({
  title,
  eyebrow,
  linkTo,
  linkLabel,
  children,
  fadeTone = 'surface-void',
  className = '',
}: MediaRailProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  const updateEdges = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const maxScroll = list.scrollWidth - list.clientWidth
    setEdges({
      start: list.scrollLeft > 4,
      end: list.scrollLeft < maxScroll - 4,
    })
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    updateEdges()
    list.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    return () => {
      list.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
  }, [updateEdges])

  const scrollRail = useCallback((direction: 1 | -1) => {
    const list = listRef.current
    if (!list) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [])

  const fadeBase =
    'pointer-events-none absolute inset-y-0 z-[5] w-16 transition-opacity duration-200 md:w-24'
  // Literal class names only — Tailwind JIT cannot compile template strings
  const fadeFrom = fadeTone === 'surface-base' ? 'from-surface-base' : 'from-surface-void'

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
          className={`${fadeBase} left-0 bg-gradient-to-r ${fadeFrom} to-transparent ${edges.start ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          aria-hidden="true"
          className={`${fadeBase} right-0 bg-gradient-to-l ${fadeFrom} to-transparent ${edges.end ? 'opacity-100' : 'opacity-0'}`}
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
