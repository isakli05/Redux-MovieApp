import { useRegion } from '@hooks/useRegion'
import { useGetWatchProvidersQuery } from '@api/endpoints/providers.endpoints'
import { getImageUrl } from '@utils/image.utils'
import { Skeleton } from '@components/ui'

export interface WatchProvidersBlockProps {
  mediaType: 'movie' | 'tv'
  id: number | string
  className?: string
}

interface ProviderGroup {
  key: 'flatrate' | 'rent' | 'buy' | 'ads' | 'free'
  label: string
}

/** Display order + Turkish labels (spec §6.6). */
const GROUPS: ProviderGroup[] = [
  { key: 'flatrate', label: 'Abonelik' },
  { key: 'rent', label: 'Kiralama' },
  { key: 'buy', label: 'Satın Alma' },
  { key: 'ads', label: 'Reklamlı' },
  { key: 'free', label: 'Ücretsiz' },
]

/**
 * Where-to-watch strip (spec §6.6). Region-aware via useRegion: the selector
 * switches the region live; provider logos (w92) link to the region's
 * JustWatch/TMDB page. JustWatch attribution is MANDATORY (D7). The whole
 * block hides when the active region has no providers at all.
 */
export function WatchProvidersBlock({ mediaType, id, className = '' }: WatchProvidersBlockProps) {
  const { region, setRegion, regions } = useRegion()
  const { data, isLoading } = useGetWatchProvidersQuery(
    { mediaType, id },
    { skip: !id }
  )

  const block = data?.[region]
  const groups = GROUPS.map((g) => ({ ...g, providers: block?.[g.key] ?? [] })).filter(
    (g) => g.providers.length > 0
  )

  if (isLoading) {
    return (
      <section className={className} aria-busy="true">
        <Skeleton variant="section" className="w-40" />
        <div className="mt-4 flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="line" className="h-12 w-12 rounded-md" />
          ))}
        </div>
      </section>
    )
  }

  // Hidden entirely when the active region has no providers (spec §6.6).
  if (!block || groups.length === 0) return null

  return (
    <section className={className} aria-label="Nerede izlenir">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-primary">Nerede İzlenir</h3>
        <label className="flex items-center gap-2 text-sm text-secondary">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Bölge</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="rounded-md border border-line bg-surface-overlay px-2.5 py-1.5 text-sm text-primary transition-colors duration-150 ease-cine hover:border-line-strong focus:border-accent focus:outline-none"
          >
            {(regions ?? []).map((option) => (
              <option key={option.iso_3166_1} value={option.iso_3166_1}>
                {option.native_name || option.english_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-wrap items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium text-secondary">{group.label}</span>
            <ul role="list" className="flex flex-wrap gap-2">
              {group.providers.map((provider) => (
                <li key={`${group.key}-${provider.provider_id}`}>
                  <a
                    href={block.link ?? 'https://www.themoviedb.org'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${provider.provider_name} — ${group.label}`}
                    className="block overflow-hidden rounded-md border border-line bg-surface-raised transition-colors duration-150 ease-cine hover:border-accent"
                  >
                    {provider.logo_path ? (
                      <img
                        src={getImageUrl(provider.logo_path, 'w92')}
                        alt={provider.provider_name}
                        loading="lazy"
                        width={46}
                        height={46}
                        className="h-[46px] w-[46px] object-contain p-1"
                      />
                    ) : (
                      <span className="flex h-[46px] w-[46px] items-center justify-center px-2 text-center text-[0.6rem] leading-tight text-secondary">
                        {provider.provider_name}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">
        Veriler:{' '}
        <a
          href="https://www.justwatch.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line-strong underline-offset-2 transition-colors duration-150 ease-cine hover:text-secondary"
        >
          JustWatch
        </a>
      </p>
    </section>
  )
}
