import { useEffect, useRef, useState } from 'react'
import { Button } from '@components/ui'

export interface ExpandableBioProps {
  text: string
  /** Long bios always offer the toggle; the exact clamp overflow is also measured at runtime. */
  longTextThreshold?: number
  className?: string
}

/**
 * Biography with a "Devamını oku" / "Daha az göster" toggle (blueprint §6 Person).
 * Local to the person pages — detail/ExpandableText belongs to another stream.
 */
export function ExpandableBio({ text, longTextThreshold = 480, className = '' }: ExpandableBioProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(text.length > longTextThreshold)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (expanded) return
    const el = textRef.current
    if (!el) return
    const measured = el.scrollHeight > el.clientHeight + 4
    setOverflows(measured || text.length > longTextThreshold)
  }, [expanded, text, longTextThreshold])

  const canToggle = overflows || expanded

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={`whitespace-pre-line text-sm leading-relaxed text-secondary sm:text-base ${
          expanded ? '' : 'line-clamp-6'
        }`}
      >
        {text}
      </p>
      {canToggle && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 px-2"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Daha az göster' : 'Devamını oku'}
        </Button>
      )}
    </div>
  )
}
