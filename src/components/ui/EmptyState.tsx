import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  hint?: string
  /** Decorative icon slot (aria-hidden is applied for you). */
  icon?: ReactNode
  /** Optional action node — typically a ui Button. */
  action?: ReactNode
}

export function EmptyState({ title, hint, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && (
        <div className="text-muted" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-primary">{title}</h3>
      {hint && <p className="max-w-md text-sm leading-relaxed text-secondary">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
