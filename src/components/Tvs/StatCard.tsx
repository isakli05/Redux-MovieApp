import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
}

/**
 * Cinematic Atlas stat tile (DESIGN_DIRECTION.md §5/§6): surface-base card,
 * hairline border (no shadows), gold icon, caption label and a display
 * tabular-nums value. Gradient chrome removed with the slate theme.
 */
function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-base p-4 transition-colors duration-150 ease-cine hover:border-line-strong">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-overlay text-accent" aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.08em] text-secondary">{label}</p>
        <p className="truncate font-display text-2xl font-semibold tabular-nums tracking-tight text-primary">
          {value}
        </p>
      </div>
    </div>
  )
}

export default StatCard
