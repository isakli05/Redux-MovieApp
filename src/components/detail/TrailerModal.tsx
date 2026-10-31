import { useEffect, useRef } from 'react'
import { Button } from '@components/ui'

export interface TrailerModalProps {
  /** YouTube video key (site=YouTube guaranteed by pickTrailer). */
  videoKey: string
  /** Accessible dialog label (the trailer's TMDB name). */
  title: string
  onClose: () => void
}

/**
 * Trailer dialog: dark overlay + 16:9 YouTube embed. Escape and backdrop
 * click close it, focus starts on the close button and returns to the
 * trigger on unmount, body scroll is locked while open (spec §4 motion is
 * not needed here — the modal only ever opens on explicit user action, so
 * no autoplay-on-load).
 */
export function TrailerModal({ videoKey, title, onClose }: TrailerModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      // Minimal focus trap: keep Tab cycling inside the dialog.
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], iframe, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-void/90 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Fragman: ${title}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-line bg-surface-base shadow-cine"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <p className="min-w-0 truncate text-sm font-medium text-primary" title={title}>
            {title}
          </p>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fragmanı kapat">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Kapat
          </Button>
        </div>
        <div className="aspect-video w-full bg-surface-void">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
            title={`Fragman: ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  )
}
