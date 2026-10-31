import { useState } from 'react'
import { Button } from '@components/ui'
import type { UnifiedCredit } from './personCredits'
import { CreditCard } from './CreditCard'

export interface CreditGroupProps {
  /** Group caption, e.g. "Oyunculuk" or "Ekip". */
  title: string
  credits: UnifiedCredit[]
  /** Rows rendered before the "Tümünü göster" expansion. */
  initial?: number
}

/** One department group inside a credits tab; long lists expand on demand. */
export function CreditGroup({ title, credits, initial = 12 }: CreditGroupProps) {
  const [showAll, setShowAll] = useState(false)

  if (credits.length === 0) return null

  const visible = showAll ? credits : credits.slice(0, initial)

  return (
    <section className="mt-8 first:mt-0" aria-label={title}>
      <h3 className="mb-2 flex items-baseline gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">{title}</span>
        <span className="text-xs tabular-nums text-muted">{credits.length.toLocaleString('tr-TR')} iş</span>
      </h3>
      <ul className="grid gap-1 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((credit) => (
          <li key={credit.key}>
            <CreditCard credit={credit} />
          </li>
        ))}
      </ul>
      {credits.length > initial && !showAll && (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAll(true)}>
          Tümünü göster ({credits.length.toLocaleString('tr-TR')})
        </Button>
      )}
    </section>
  )
}
