import { useEffect, useRef, useState } from 'react'

export interface ExpandableTextProps {
  text: string
  expandLabel?: string
  collapseLabel?: string
  className?: string
}

/**
 * Text block clamped to 3 lines; renders a "Devamını oku" toggle only when
 * the content actually overflows the clamp (measured via scrollHeight vs
 * clientHeight — robust to font size and container width, spec §6.4).
 */
export function ExpandableText({
  text,
  expandLabel = 'Devamını oku',
  collapseLabel = 'Daha az göster',
  className = '',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    measure()
    // Re-measure when the container width (or web font) settles.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  if (!text) return null

  return (
    <div className={className}>
      <p
        ref={ref}
        className={`leading-relaxed text-secondary ${expanded ? '' : 'line-clamp-3'}`}
      >
        {text}
      </p>
      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors duration-150 ease-cine hover:text-accent-hover"
        >
          {expanded ? collapseLabel : expandLabel}
          <svg
            className={`h-4 w-4 transition-transform duration-150 ease-cine ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}
