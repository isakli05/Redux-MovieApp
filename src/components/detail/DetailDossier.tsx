import { useState } from 'react'
import type { ReactNode } from 'react'
import { BackdropHero, Button, PosterCard, Tabs } from '@components/ui'
import type { TabItem } from '@components/ui'
import MediaGallery from '@components/MediaGallery/MediaGallery'
import { getPosterUrl, posterSrcset } from '@utils/image.utils'
import type { DetailDossierData } from './detail.types'
import { MetaChips } from './MetaChips'
import { ExpandableText } from './ExpandableText'
import { CrewRow } from './CrewRow'
import { WatchProvidersBlock } from './WatchProvidersBlock'
import { CastRail } from './CastRail'
import { FactsPanel } from './FactsPanel'
import { SeasonsStrip } from './SeasonsStrip'
import { CollectionBand } from './CollectionBand'
import { TrailerModal } from './TrailerModal'

const anchorBase =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 ease-cine'

const anchorOutline = `${anchorBase} border border-line-strong text-primary hover:border-accent hover:text-accent`

const anchorGhost = `${anchorBase} text-secondary hover:text-primary`

/** Poster tile with fallback — shared by the hero (mobile) and the overlap column (desktop). */
function PosterTile({ data }: { data: DetailDossierData }) {
  if (!data.posterPath) {
    return (
      <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg border border-line bg-surface-raised shadow-cine">
        <span className="font-display text-6xl font-semibold text-secondary">
          {data.title.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
        </span>
      </div>
    )
  }

  return (
    <img
      src={getPosterUrl(data.posterPath, 'MEDIUM')}
      srcSet={posterSrcset(data.posterPath)}
      sizes="(max-width: 768px) 40vw, 256px"
      alt={`${data.title} afişi`}
      loading="eager"
      decoding="async"
      className="aspect-[2/3] w-full rounded-lg border border-line bg-surface-raised object-cover shadow-cine"
    />
  )
}

function PlayIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  )
}

/**
 * Shared movie/TV dossier shell (DESIGN_DIRECTION.md §6 "detail (dossier)"):
 * BackdropHero with overlapping poster (desktop) / inline poster (mobile),
 * Fraunces title block, meta chips, action row (Fragman modal + external
 * links), overview, crew, JustWatch providers, and the
 * Kadro / Medya / Öneriler / Detaylar tabs. TV appends the seasons strip;
 * movies append the collection band. Empty sections hide themselves.
 */
export function DetailDossier({ data }: { data: DetailDossierData }) {
  const [activeTab, setActiveTab] = useState('cast')
  const [trailerOpen, setTrailerOpen] = useState(false)

  const tabs: TabItem[] = [
    ...(data.cast.length > 0 ? [{ id: 'cast', label: 'Kadro' }] : []),
    ...(data.hasMedia ? [{ id: 'media', label: 'Medya' }] : []),
    ...(data.recommendations.length > 0 ? [{ id: 'recommendations', label: 'Öneriler' }] : []),
    ...((data.facts.length > 0 || data.keywords.length > 0) ? [{ id: 'details', label: 'Detaylar' }] : []),
  ]
  const currentTab = tabs.find((tab) => tab.id === activeTab)?.id ?? tabs[0]?.id

  let panel: ReactNode = null
  if (currentTab === 'cast') {
    panel = <CastRail cast={data.cast} detailPath={`/${data.mediaType}/${data.slug}`} />
  } else if (currentTab === 'media') {
    panel = <MediaGallery mediaType={data.mediaType} id={data.slug} defaultTab="videos" />
  } else if (currentTab === 'recommendations') {
    panel = (
      <ul
        role="list"
        className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
      >
        {data.recommendations.map((item) => (
          <li key={`${item.media_type}-${item.id}`}>
            <PosterCard item={item} size="md" />
          </li>
        ))}
      </ul>
    )
  } else if (currentTab === 'details') {
    panel = (
      <FactsPanel facts={data.facts} keywords={data.keywords} mediaType={data.mediaType} />
    )
  }

  return (
    <article className="bg-surface-void">
      <BackdropHero backdropPath={data.backdropPath}>
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {/* Mobile: poster inline, centered above the title (spec §6.1) */}
          <div className="mx-auto w-40 pb-5 md:hidden">
            <PosterTile data={data} />
          </div>

          <div className="pb-8 text-center md:pb-24 md:pl-[16.5rem] md:text-left lg:pb-28 lg:pl-[18.5rem]">
            <h1 className="mx-auto max-w-3xl font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-primary md:mx-0">
              {data.title}
            </h1>
            {data.originalTitle && (
              <p className="mt-1.5 text-lg text-secondary">{data.originalTitle}</p>
            )}
            {data.tagline && (
              <p className="mt-3 italic text-secondary">{data.tagline}</p>
            )}

            <MetaChips
              items={data.metaChips}
              genres={data.genres}
              score={data.voteAverage}
              className="mt-5 justify-center md:justify-start"
            />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {data.trailerKey && (
                <Button size="md" onClick={() => setTrailerOpen(true)}>
                  <PlayIcon />
                  Fragman
                </Button>
              )}
              {data.imdbId && (
                <a
                  href={`https://imdb.com/title/${data.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${anchorOutline} h-10 px-4 text-sm`}
                >
                  IMDb
                </a>
              )}
              <a
                href={`https://www.themoviedb.org/${data.mediaType}/${data.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${anchorGhost} h-10 px-4 text-sm`}
              >
                TMDB
              </a>
            </div>
          </div>
        </div>
      </BackdropHero>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-x-10 md:grid-cols-[14rem_1fr] lg:grid-cols-[16rem_1fr]">
          {/* Desktop: poster card overlapping the hero bottom-left (spec §6.1) */}
          <div className="relative z-10 hidden md:block">
            <div className="-mt-32 lg:-mt-40">
              <PosterTile data={data} />
            </div>
          </div>

          <div className="min-w-0 space-y-10 py-10 md:py-12">
            <section aria-label="Konu">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">
                Konu
              </h2>
              {data.overview ? (
                <ExpandableText text={data.overview} />
              ) : (
                <p className="text-secondary">Açıklama bulunmuyor.</p>
              )}
            </section>

            <CrewRow groups={data.crew} />

            <WatchProvidersBlock mediaType={data.mediaType} id={data.id} />
          </div>
        </div>

        {data.collection && <CollectionBand collectionId={data.collection.id} className="mt-2" />}

        {tabs.length > 0 && (
          <div className="py-10 md:py-12">
            <Tabs
              tabs={tabs}
              activeId={currentTab ?? 'cast'}
              onChange={setActiveTab}
              aria-label="İçerik sekmeleri"
            >
              {panel}
            </Tabs>
          </div>
        )}

        {data.mediaType === 'tv' && (
          <SeasonsStrip tvSlug={data.slug} seasons={data.seasons ?? []} className="pb-16" />
        )}
      </div>

      {trailerOpen && data.trailerKey && (
        <TrailerModal
          videoKey={data.trailerKey}
          title={data.trailerName || data.title}
          onClose={() => setTrailerOpen(false)}
        />
      )}
    </article>
  )
}
