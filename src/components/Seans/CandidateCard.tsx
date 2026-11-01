import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { getPosterUrl } from '@utils/image.utils'
import type { MediaRef } from '@/lib/mediaRef'
import type { RankedCandidate } from '@/lib/seans/types'

interface CandidateCardProps {
  ranked: RankedCandidate
  /** 1 tabanlı sıra numarası. */
  rank: number
  /** Giriş yapılmışsa hesap kayıt aksiyonları gösterilir. */
  authed: boolean
  onReject: (ref: MediaRef) => void
  onWatched: (ref: MediaRef) => void
  onFavorite: (ref: MediaRef) => Promise<boolean>
  onWatchlist: (ref: MediaRef) => Promise<boolean>
}

function yearOf(date: string | null): string {
  return date && date.length >= 4 ? date.slice(0, 4) : ''
}

const kindLabel: Record<string, string> = { movie: 'Film', tv: 'Dizi', person: 'Kişi' }

/**
 * Sıralı aday kartı — gerçek eşleşme sebepleriyle (uydurma yok): poster,
 * başlık, eşleşme yüzdesi, kriterler ve seans aksiyonları.
 */
export function CandidateCard({
  ranked,
  rank,
  authed,
  onReject,
  onWatched,
  onFavorite,
  onWatchlist,
}: CandidateCardProps) {
  const { candidate, score, reasons } = ranked
  const ref = candidate.ref
  const [favState, setFavState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [wlState, setWlState] = useState<'idle' | 'busy' | 'done'>('idle')

  const save = async (
    current: 'idle' | 'busy' | 'done',
    set: (s: 'idle' | 'busy' | 'done') => void,
    action: (ref: MediaRef) => Promise<boolean>,
  ) => {
    if (current !== 'idle') return
    set('busy')
    set((await action(ref)) ? 'done' : 'idle')
  }

  return (
    <article
      className="flex gap-4 rounded-lg border border-line-strong bg-surface-raised p-4 shadow-cine sm:gap-5 sm:p-5"
      aria-labelledby={`seans-candidate-${ref.kind}-${ref.id}-title`}
    >
      <Link
        to={`/${ref.kind}/${ref.id}`}
        className="group/card relative block w-20 shrink-0 self-start rounded-md border border-line-strong bg-surface-void transition-colors duration-150 ease-cine hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised sm:w-24"
        aria-label={`${candidate.title} detay sayfası`}
      >
        {candidate.posterPath ? (
          <img
            src={getPosterUrl(candidate.posterPath, 'MEDIUM')}
            alt={`${candidate.title} afişi`}
            loading="lazy"
            decoding="async"
            className="aspect-[2/3] w-full rounded-md object-cover"
          />
        ) : (
          <span className="flex aspect-[2/3] w-full items-center justify-center rounded-md font-display text-3xl font-semibold text-secondary">
            {candidate.title.charAt(0).toLocaleUpperCase('tr-TR')}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span aria-hidden="true" className="font-display text-2xl font-semibold text-accent">
            {rank}.
          </span>
          <h3
            id={`seans-candidate-${ref.kind}-${ref.id}-title`}
            className="min-w-0 font-display text-lg font-semibold tracking-tight text-primary"
          >
            <Link
              to={`/${ref.kind}/${ref.id}`}
              className="transition-colors duration-150 ease-cine hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised rounded-sm"
            >
              {candidate.title}
            </Link>
          </h3>
          <span className="text-xs uppercase tracking-[0.08em] text-muted">
            {kindLabel[ref.kind]}
            {yearOf(candidate.releaseDate) ? ` · ${yearOf(candidate.releaseDate)}` : ''}
          </span>
          <span className="ml-auto inline-flex items-center rounded-full border border-accent px-2.5 py-1 text-xs font-semibold text-accent">
            %{score} eşleşme
          </span>
        </div>

        {reasons.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {reasons.map((reason, index) => (
              <li key={`${reason.kind}-${index}`} className="flex items-start gap-2 text-sm text-secondary">
                <CheckIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{reason.label}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onReject(ref)}>
            Bu değil
          </Button>
          <Button size="sm" variant="outline" onClick={() => onWatched(ref)}>
            İzledim
          </Button>
          {authed && (
            <>
              <Button
                size="sm"
                variant="ghost"
                loading={favState === 'busy'}
                disabled={favState === 'done'}
                onClick={() => save(favState, setFavState, onFavorite)}
              >
                {favState === 'done' ? 'Favorilerde' : 'Favorilere ekle'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={wlState === 'busy'}
                disabled={wlState === 'done'}
                onClick={() => save(wlState, setWlState, onWatchlist)}
              >
                {wlState === 'done' ? 'İzleme listesinde' : 'İzleme listesine ekle'}
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
