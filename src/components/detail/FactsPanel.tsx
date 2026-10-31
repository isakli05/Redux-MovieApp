import { Link } from 'react-router-dom'
import { slugify } from '@utils/slug.utils'
import type { FactRow } from './detail.types'

export interface FactsPanelProps {
  facts: FactRow[]
  keywords: { id: number; name: string }[]
  /** 'movie' | 'tv' — keyword links target /keyword/:id/{movie|tv}. */
  mediaType: 'movie' | 'tv'
  className?: string
}

/**
 * "Detaylar" tab body (spec §6.7): keyword chips linking to the keyword
 * listings, then a definition grid of the dossier facts. Rows with empty
 * values are already filtered out by the dossier builders.
 */
export function FactsPanel({ facts, keywords, mediaType, className = '' }: FactsPanelProps) {
  if (facts.length === 0 && keywords.length === 0) return null

  return (
    <div className={`grid gap-10 lg:grid-cols-2 ${className}`}>
      {keywords.length > 0 && (
        <section aria-label="Anahtar kelimeler">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-accent">
            Anahtar Kelimeler
          </h3>
          <ul role="list" className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <li key={keyword.id}>
                <Link
                  to={`/keyword/${keyword.id}-${slugify(keyword.name)}/${mediaType}`}
                  className="inline-flex items-center rounded-full border border-line bg-surface-overlay px-3 py-1.5 text-sm font-medium text-secondary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent"
                >
                  {keyword.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {facts.length > 0 && (
        <section aria-label="Detaylar">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-accent">
            Künye
          </h3>
          <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-surface-base px-4 py-3"
              >
                <dt className="text-sm text-secondary">{fact.label}</dt>
                <dd className="text-right text-sm font-medium text-primary">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}
