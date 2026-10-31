import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { SeasonCastMember } from '../../types/seasonCredits'
import { getProfileUrl } from '../../utils'

interface SeasonCastPreviewProps {
  cast: SeasonCastMember[]
  maxVisible?: number
}

const SeasonCastPreview = memo(function SeasonCastPreview({ cast, maxVisible = 5 }: SeasonCastPreviewProps) {
  if (!cast || cast.length === 0) {
    return null
  }

  const visibleCast = cast.slice(0, maxVisible)
  const remainingCount = cast.length - maxVisible

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Oyuncular</span>

      <div className="flex items-center -space-x-2">
        {visibleCast.map((member) => (
          <Link
            key={member.id}
            to={`/person/${member.id}`}
            className="group relative rounded-full"
            title={`${member.name}${member.roles?.[0]?.character ? ` — ${member.roles[0].character}` : ''}`}
          >
            <img
              src={getProfileUrl(member.profile_path, 'SMALL')}
              alt={member.name}
              className="h-10 w-10 rounded-full border-2 border-surface-base object-cover transition-colors duration-250 ease-cine group-hover:border-accent"
              loading="lazy"
              decoding="async"
            />
          </Link>
        ))}

        {remainingCount > 0 && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-base bg-surface-overlay"
            title={`${remainingCount} oyuncu daha`}
          >
            <span className="text-xs font-semibold tabular-nums text-secondary">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default SeasonCastPreview
