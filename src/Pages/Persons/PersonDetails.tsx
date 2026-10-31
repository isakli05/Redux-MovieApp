import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { useGetPersonDetailsQuery } from '@/api/endpoints/persons.endpoints'
import { useSEO } from '@hooks/useSEO'
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  MediaRail,
  PosterCard,
  SectionHeader,
  Skeleton,
  Tabs,
} from '@components/ui'
import MediaGallery from '@components/MediaGallery/MediaGallery'
import { ExpandableBio } from '@components/Persons/ExpandableBio'
import { CreditGroup } from '@components/Persons/CreditGroup'
import {
  buildExternalLinks,
  calcAge,
  departmentLabel,
  mostKnownCredits,
  sortCredits,
  unifyMovieCredits,
  unifyTvCredits,
} from '@components/Persons/personCredits'
import type { CreditSortMode, PersonDetailFull } from '@components/Persons/personCredits'
import { formatDate } from '@utils/date.utils'
import { getProfileUrl, posterSrcset } from '@utils/image.utils'
import Person404 from './Person404'

const SORT_OPTIONS: { id: CreditSortMode; label: string }[] = [
  { id: 'year-desc', label: 'Yıl · Yeni → Eski' },
  { id: 'year-asc', label: 'Yıl · Eski → Yeni' },
  { id: 'popularity', label: 'Popülerlik' },
]

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-primary">{value}</dd>
    </div>
  )
}

/** Branded loading placeholder matching the hero layout. */
function PersonDetailsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:px-8"
      role="status"
      aria-live="polite"
    >
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton variant="poster" className="aspect-[2/3] w-full max-w-[320px] rounded-xl" />
        <div className="space-y-4">
          <Skeleton variant="section" className="w-40" />
          <Skeleton variant="section" className="w-3/4" />
          <Skeleton variant="line" className="w-1/3" />
          <div className="grid gap-4 rounded-lg border border-line bg-surface-base p-5 sm:grid-cols-2">
            <Skeleton variant="line" className="w-24" />
            <Skeleton variant="line" className="w-40" />
            <Skeleton variant="line" className="w-24" />
            <Skeleton variant="line" className="w-48" />
          </div>
        </div>
      </div>
      <span className="sr-only">Kişi bilgileri yükleniyor…</span>
    </div>
  )
}

function PersonDetails() {
  const { cast_id: castId } = useParams()
  const { data, isLoading, error, refetch } = useGetPersonDetailsQuery(castId ?? '', {
    skip: !castId,
  })
  const person = data as PersonDetailFull | undefined

  const bioDescription = useMemo(() => {
    if (!person?.biography) return undefined
    const normalized = person.biography.replace(/\s+/g, ' ').trim()
    return normalized.length > 160 ? `${normalized.slice(0, 157)}…` : normalized
  }, [person?.biography])

  useSEO({
    title: person?.name,
    description:
      bioDescription ??
      (person ? `${person.name} — filmleri, dizileri ve kariyer bilgileri` : undefined),
    image: person?.profile_path ?? null,
  })

  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie')
  const [sortMode, setSortMode] = useState<CreditSortMode>('year-desc')

  const movieCredits = useMemo(
    () => unifyMovieCredits(person?.movie_credits?.cast, person?.movie_credits?.crew),
    [person],
  )
  const tvCredits = useMemo(
    () => unifyTvCredits(person?.tv_credits?.cast, person?.tv_credits?.crew),
    [person],
  )
  const knownFor = useMemo(() => (person ? mostKnownCredits(person, 12) : []), [person])

  if (error) {
    const status = 'status' in error ? (error.status as number) : undefined
    if (status === 404) return <Person404 />
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="Kişi yüklenemedi"
          message="Kişi bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
          onRetry={refetch}
          backTo="/person"
          backLabel="Popüler Kişilere Dön"
        />
      </div>
    )
  }

  if (isLoading || !person) {
    return <PersonDetailsSkeleton />
  }

  const movieCast = sortCredits(movieCredits.filter((c) => c.isCast), sortMode)
  const movieCrew = sortCredits(movieCredits.filter((c) => !c.isCast), sortMode)
  const tvCast = sortCredits(tvCredits.filter((c) => c.isCast), sortMode)
  const tvCrew = sortCredits(tvCredits.filter((c) => !c.isCast), sortMode)

  const tabs = [
    ...(movieCredits.length > 0
      ? [{ id: 'movie', label: `Filmler (${movieCredits.length.toLocaleString('tr-TR')})` }]
      : []),
    ...(tvCredits.length > 0
      ? [{ id: 'tv', label: `Diziler (${tvCredits.length.toLocaleString('tr-TR')})` }]
      : []),
  ]
  const effectiveTab = tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0]?.id as 'movie' | 'tv')

  const age = calcAge(person.birthday, person.deathday)
  const ageAtDeath = person.deathday ? calcAge(person.birthday, person.deathday) : null
  const externalLinks = buildExternalLinks(person)

  return (
    <article className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:px-8">
      {/* Profile hero */}
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          {person.profile_path ? (
            <img
              src={getProfileUrl(person.profile_path, 'LARGE')}
              srcSet={posterSrcset(person.profile_path)}
              sizes="(max-width: 1024px) 45vw, 320px"
              alt={`${person.name} profili`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="aspect-[2/3] w-full max-w-[320px] rounded-xl border border-line object-cover"
            />
          ) : (
            <div className="flex aspect-[2/3] w-full max-w-[320px] flex-col items-center justify-center rounded-xl border border-line bg-surface-raised p-6 text-center">
              <span aria-hidden="true" className="font-display text-6xl font-semibold text-secondary">
                {person.name.trim().charAt(0).toLocaleUpperCase('tr-TR')}
              </span>
              <span className="mt-3 text-sm text-muted">{person.name}</span>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">Kişi</p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-primary sm:text-5xl">
            {person.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-line bg-surface-overlay px-3 py-1.5 text-sm font-medium text-secondary">
              {departmentLabel(person.known_for_department)}
            </span>
          </div>

          {/* Facts panel */}
          {(person.birthday || person.place_of_birth || person.deathday) && (
          <dl className="mt-6 grid gap-4 rounded-lg border border-line bg-surface-base p-5 sm:grid-cols-2">
            {person.birthday && (
              <Fact
                label="Doğum"
                value={`${formatDate(person.birthday)}${
                  age !== null && !person.deathday ? ` (${age} yaşında)` : ''
                }`}
              />
            )}
            {person.place_of_birth && <Fact label="Doğum Yeri" value={person.place_of_birth} />}
            {person.deathday && (
              <Fact
                label="Vefat"
                value={`${formatDate(person.deathday)}${
                  ageAtDeath !== null ? ` (${ageAtDeath} yaşında vefat etti)` : ''
                }`}
              />
            )}
          </dl>
          )}

          {/* External links */}
          <div className="mt-6 flex flex-wrap gap-2">
            {externalLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-3 text-sm font-medium text-primary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent"
              >
                {link.label}
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Biography */}
      {person.biography ? (
        <section className="mt-14">
          <SectionHeader title="Biyografi" eyebrow="Hikâye" as="h2" />
          <ExpandableBio text={person.biography} />
        </section>
      ) : null}

      {/* Most known works */}
      {knownFor.length > 0 && (
        <MediaRail title="En Bilinen İşler" eyebrow="Öne Çıkanlar" className="mt-14">
          {knownFor.map((item) => (
            <PosterCard key={`${item.media_type}-${item.id}`} item={item} size="sm" />
          ))}
        </MediaRail>
      )}

      {/* Credits */}
      {tabs.length > 0 ? (
        <section className="mt-14">
          <SectionHeader title="Kariyer" eyebrow="Krediler" as="h2" />
          <Tabs
            tabs={tabs}
            activeId={effectiveTab}
            onChange={(id) => setActiveTab(id as 'movie' | 'tv')}
            aria-label="Kredi türü"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
                Sırala
              </span>
              {SORT_OPTIONS.map((option) => (
                <Chip
                  key={option.id}
                  active={sortMode === option.id}
                  onClick={() => setSortMode(option.id)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>

            {effectiveTab === 'movie' ? (
              <>
                <CreditGroup title="Oyunculuk" credits={movieCast} />
                <CreditGroup title="Ekip" credits={movieCrew} />
              </>
            ) : (
              <>
                <CreditGroup title="Oyunculuk" credits={tvCast} />
                <CreditGroup title="Ekip" credits={tvCrew} />
              </>
            )}
          </Tabs>
        </section>
      ) : (
        <section className="mt-14">
          <EmptyState
            title="Kredi bulunamadı"
            hint="Bu kişi için henüz film veya dizi kaydı bulunmuyor."
            action={
              <Button variant="outline" size="sm" to="/person">
                Popüler Kişiler
              </Button>
            }
          />
        </section>
      )}

      {/* Profile images gallery (legacy component; restyled by the media-gallery stream) */}
      <div className="mt-14">
        <MediaGallery mediaType="person" id={String(person.id)} defaultTab="profiles" />
      </div>
    </article>
  )
}

export default PersonDetails
