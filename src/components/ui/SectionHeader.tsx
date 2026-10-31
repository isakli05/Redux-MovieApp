import { Link } from 'react-router-dom'

export interface SectionHeaderProps {
  title: string
  /** Caption eyebrow above the title (gold, uppercase). */
  eyebrow?: string
  /** Optional "Tümü" ghost link target. */
  linkTo?: string
  linkLabel?: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}

export function SectionHeader({
  title,
  eyebrow,
  linkTo,
  linkLabel = 'Tümü',
  as: Heading = 'h2',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">{eyebrow}</p>
        )}
        <Heading className="truncate font-display text-2xl font-semibold tracking-tight text-primary">
          {title}
        </Heading>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-secondary transition-colors duration-150 ease-cine hover:text-accent"
        >
          {linkLabel}
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </div>
  )
}
