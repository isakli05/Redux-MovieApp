import { Link } from 'react-router-dom'
import { getPosterUrl } from '@utils/image.utils'
import type { UnifiedCredit } from './personCredits'
import { jobLabel } from './personCredits'

function initialOf(title: string): string {
  const trimmed = title.trim()
  return trimmed ? trimmed.charAt(0).toLocaleUpperCase('tr-TR') : '?'
}

/**
 * Compact row card for one credit: poster thumb, title, role (character or
 * crew job), year badge and TV episode count. Links to /movie/:id or /tv/:id.
 */
export function CreditCard({ credit }: { credit: UnifiedCredit }) {
  const href = `/${credit.kind}/${credit.id}`
  const role = credit.isCast
    ? credit.character
      ? `${credit.character} rolünde`
      : ''
    : jobLabel(credit.job)

  return (
    <Link
      to={href}
      className="group/credit flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors duration-150 ease-cine hover:border-line hover:bg-surface-base"
    >
      <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-surface-raised">
        {credit.posterPath ? (
          <img
            src={getPosterUrl(credit.posterPath, 'SMALL')}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-secondary">
            {initialOf(credit.title)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary transition-colors duration-150 ease-cine group-hover/credit:text-accent">
          {credit.title}
        </p>
        {role && <p className="truncate text-xs text-secondary">{role}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {typeof credit.episodeCount === 'number' && credit.episodeCount > 1 && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] tabular-nums text-secondary">
            {credit.episodeCount} bölüm
          </span>
        )}
        {credit.year && (
          <span className="rounded border border-line px-1.5 py-0.5 text-xs tabular-nums text-muted">
            {credit.year}
          </span>
        )}
      </div>
    </Link>
  )
}
