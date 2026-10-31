import type { ButtonHTMLAttributes } from 'react'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Controlled active state: gold border + gold text (spec §5). */
  active?: boolean
}

/** Pill for filters/genres. Controlled: parent owns `active` and toggles via onClick. */
export function Chip({ active = false, className = '', children, ...rest }: ChipProps) {
  const state = active
    ? 'border-accent bg-surface-overlay text-accent'
    : 'border-transparent bg-surface-overlay text-secondary hover:border-line-strong hover:text-primary'
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-cine ${state} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
