import { useEffect, useMemo, useState } from 'react'
import type { MediaSummary } from '@/types/mediaSummary'
import { useGetTrendingMixedQuery } from '@api/endpoints/movies.endpoints'
import { BackdropHero, Button, RatingBadge } from '@components/ui'

/** Spec §6: 7 saniyede bir ilerle; hover/focus ve reduced-motion'da duraklat. */
const AUTO_ADVANCE_MS = 7000
const HERO_SLIDE_COUNT = 3

const mediaLabel: Record<MediaSummary['media_type'], string> = {
  movie: 'Film',
  tv: 'Dizi',
  person: 'Kişi',
}

function yearOf(releaseDate?: string | null): string {
  if (!releaseDate || releaseDate.length < 4) return ''
  const year = releaseDate.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : ''
}

/**
 * prefers-reduced-motion dinleyicisi. jsdom'da matchMedia bulunmadığından
 * güvendir (test ortamında statik false düşer).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

const chipClass =
  'inline-flex items-center rounded-md border border-line bg-surface-overlay px-2 py-0.5 text-xs font-medium text-primary'

function HeroSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="shimmer motion-safe:animate-shimmer mb-4 h-3 w-28 rounded" />
      <div className="shimmer motion-safe:animate-shimmer mb-4 h-12 w-3/4 max-w-2xl rounded-lg" />
      <div className="shimmer motion-safe:animate-shimmer mb-3 h-4 w-2/3 max-w-xl rounded" />
      <div className="shimmer motion-safe:animate-shimmer h-4 w-1/2 max-w-lg rounded" />
    </div>
  )
}

function HeroFallback() {
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-accent">LMDB</p>
      <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-primary md:text-5xl">
        Film ve Dizi Keşif
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-secondary md:text-base">
        Trend yapımlardan gizli cevherlere kadar binlerce film ve diziye göz atın.
      </p>
    </div>
  )
}

function HeroSlide({ slide }: { slide: MediaSummary }) {
  const year = yearOf(slide.release_date)
  const detailPath = `/${slide.media_type}/${slide.id}`
  const hasScore = typeof slide.vote_average === 'number' && slide.vote_average > 0

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-accent">
        Bugün öne çıkan {mediaLabel[slide.media_type].toLocaleLowerCase('tr-TR')}
      </p>
      {/* min-h: 2 satır rezerve — slayt değişiminde yerleşim kaymasını (CLS) önler */}
      <h1 className="max-w-4xl line-clamp-2 min-h-[2.2em] font-display text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.08] tracking-tight text-primary">
        {slide.title}
      </h1>

      <div className="mt-4 flex min-h-[1.75rem] flex-wrap items-center gap-x-3 gap-y-2">
        {year && <span className={chipClass}>{year}</span>}
        <span className={chipClass}>{mediaLabel[slide.media_type]}</span>
        {hasScore && (
          <span className="flex items-center gap-1.5">
            <RatingBadge score={slide.vote_average} size="sm" />
            <span className="text-xs text-secondary">TMDB</span>
          </span>
        )}
      </div>

      <p className="mt-4 max-w-2xl line-clamp-2 min-h-[2.7em] text-sm leading-relaxed text-secondary md:text-base">
        {slide.overview ?? ''}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button to={detailPath} size="lg">
          Detaylar
        </Button>
        <Button to={detailPath} variant="outline" size="lg">
          Fragman
        </Button>
      </div>
    </div>
  )
}

/**
 * Home hero (spec §6): trending/day ilk 3 film-dizisi, 600ms çapraz geçişli
 * katmanlar, 7 sn otomatik ilerleme (hover/focus/reduced-motion'da duraklar),
 * ilerleme noktaları, Fraunces başlık, meta çipleri ve Detaylar/Fragman
 * butonları. Tek istek TrendingRail ile RTK Query cache'inden paylaşılır.
 */
export function HomeHero() {
  const { data, isLoading } = useGetTrendingMixedQuery({ timeWindow: 'day' })
  const reducedMotion = usePrefersReducedMotion()

  const slides = useMemo(
    () =>
      (data?.results ?? [])
        .filter(
          (item) =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            Boolean(item.backdrop_path) &&
            Boolean(item.title)
        )
        .slice(0, HERO_SLIDE_COUNT),
    [data]
  )

  const [active, setActive] = useState(0)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [focusPaused, setFocusPaused] = useState(false)

  // Slayt sayısı değişirse (veri yenilendi) aktif indeksi aralıkta tut.
  const activeIndex = slides.length ? Math.min(active, slides.length - 1) : 0
  const current = slides.length ? slides[activeIndex] : undefined

  useEffect(() => {
    if (hoverPaused || focusPaused || reducedMotion || slides.length < 2) return
    const timer = window.setTimeout(() => {
      setActive((prev) => (prev + 1) % slides.length)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [active, hoverPaused, focusPaused, reducedMotion, slides.length])

  const layers: (MediaSummary | null)[] = slides.length > 0 ? slides : [null]

  return (
    <section
      aria-label="Öne çıkanlar"
      aria-roledescription="karusel"
      className="relative flex h-[74vh] min-h-[520px] flex-col justify-end overflow-hidden bg-surface-void md:h-[76vh] md:min-h-[560px]"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      <div className="absolute inset-0" aria-hidden="true">
        {layers.map((slide, index) => {
          const isActive = index === activeIndex
          return (
            <div
              key={slide ? `${slide.media_type}-${slide.id}` : 'hero-fallback'}
              className={`absolute inset-0 transition-opacity duration-[600ms] ease-cine ${
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <BackdropHero backdropPath={slide?.backdrop_path ?? null} className="h-full" />
            </div>
          )
        })}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 sm:px-6 md:pb-14 lg:px-8">
        {/* min-h: iskelet→içerik geçişinde blok yüksekliğini sabitler (CLS) */}
        <div key={current ? `${current.media_type}-${current.id}` : 'hero-static'} className="min-h-[380px] md:min-h-[330px]">
          {isLoading ? <HeroSkeleton /> : current ? <HeroSlide slide={current} /> : <HeroFallback />}
        </div>

        {slides.length > 1 && (
          <div className="mt-4 flex items-center gap-1" role="group" aria-label="Slaytlar">
            {slides.map((slide, index) => (
              <button
                key={`${slide.media_type}-${slide.id}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${index + 1}. öne çıkanı göster`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className="flex h-6 min-w-6 items-center justify-center rounded-full transition-colors duration-150 ease-cine hover:bg-surface-overlay"
              >
                {/* 24px dokunma alanı + görsel nokta ayrı: target-size erişilebilirlik */}
                <span
                  className={`block h-2 rounded-full transition-all duration-250 ease-cine ${
                    index === activeIndex
                      ? 'w-7 bg-accent'
                      : 'w-2 bg-line-strong group-hover:bg-accent-hover'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
