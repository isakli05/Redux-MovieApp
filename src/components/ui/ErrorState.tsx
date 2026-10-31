import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  message?: string
  /** When provided, renders the retry Button. */
  onRetry?: () => void
  retryLabel?: string
  /** Optional back navigation link target. */
  backTo?: string
  backLabel?: string
}

export function ErrorState({
  title = 'Bir şeyler ters gitti',
  message,
  onRetry,
  retryLabel = 'Tekrar dene',
  backTo,
  backLabel = 'Geri dön',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <svg
        className="h-10 w-10 text-danger"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
      <h3 className="font-display text-lg font-semibold text-primary">{title}</h3>
      {message && <p className="max-w-md text-sm leading-relaxed text-secondary">{message}</p>}
      {(onRetry || backTo) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button onClick={onRetry} size="sm">
              {retryLabel}
            </Button>
          )}
          {backTo && (
            <Button variant="ghost" size="sm" to={backTo}>
              {backLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
