import { Button } from '@components/ui'

export interface DetailNotFoundProps {
  mediaType: 'movie' | 'tv'
  className?: string
}

/**
 * Typed 404 body for TMDB status_code 34 / HTTP 404 responses on detail
 * routes (spec §6.9). Movie404 and Tv404 pages render this so every bad
 * /movie|tv/:id URL gets a styled Turkish page with kit buttons.
 */
export function DetailNotFound({ mediaType, className = '' }: DetailNotFoundProps) {
  const noun = mediaType === 'movie' ? 'film' : 'dizi'
  const listLabel = mediaType === 'movie' ? 'Filmlere Göz At' : 'Dizilere Göz At'

  return (
    <div
      className={`flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center ${className}`}
    >
      <svg
        className="h-14 w-14 text-accent"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2.5" y="3.5" width="19" height="17" rx="2.5" />
        <path d="M7 3.5v17M17 3.5v17M2.5 8.5h4.5M2.5 15.5h4.5M17 8.5h4.5M17 15.5h4.5" />
      </svg>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-primary">
        Böyle bir {noun} bulunamadı
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-secondary">
        Aradığınız {noun} silinmiş, yanlış bağlantıya düşmüş ya da hiç var olmamış olabilir.
        Listelerden devam edebilirsiniz.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button to={mediaType === 'movie' ? '/movie' : '/tv'}>{listLabel}</Button>
        <Button to="/" variant="ghost">
          Ana Sayfa
        </Button>
      </div>
    </div>
  )
}
