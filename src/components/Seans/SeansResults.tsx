import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import type { MediaRef } from '@/lib/mediaRef'
import type { RankedCandidate } from '@/lib/seans/types'
import { CandidateCard } from './CandidateCard'

export type SeansLoadStatus = 'loading' | 'error' | 'empty' | 'ready'

export interface UndoState {
  /** Geri alınacak aksiyonun insan diliyle tarifi. */
  label: string
  onUndo: () => void
}

interface SeansResultsProps {
  status: SeansLoadStatus
  ranked: RankedCandidate[]
  /** Gösterilen aday sayısı (dizinin ilk N'i). */
  limit: number
  /** 'Daha fazla göster' ile açılabilecek ek aday var mı? */
  hasMore: boolean
  errorMessage?: string
  /** Boş durumda bir sonraki gevşetme önerisinin açıklaması. */
  loosenNote?: string
  onRetry: () => void
  onLoosen: () => void
  onMore: () => void
  authed: boolean
  onReject: (ref: MediaRef) => void
  onWatched: (ref: MediaRef) => void
  onFavorite: (ref: MediaRef) => Promise<boolean>
  onWatchlist: (ref: MediaRef) => Promise<boolean>
  undo: UndoState | null
}

function LoadingCards() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4 rounded-lg border border-line-strong bg-surface-raised p-4 sm:p-5">
          <Skeleton variant="poster" className="w-20 shrink-0 sm:w-24" />
          <div className="flex-1 space-y-3 py-2">
            <Skeleton variant="line" className="w-2/3" />
            <Skeleton variant="line" className="w-1/2" />
            <Skeleton variant="line" className="w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Sonuç bölgesi — durum makinesi: yükleniyor / hata / boş (kısıt gevşetme
 * önerisiyle) / hazır. Ekran okuyucular için aria-live ile duyurulur.
 */
export function SeansResults({
  status,
  ranked,
  limit,
  hasMore,
  errorMessage,
  loosenNote,
  onRetry,
  onLoosen,
  onMore,
  authed,
  onReject,
  onWatched,
  onFavorite,
  onWatchlist,
  undo,
}: SeansResultsProps) {
  return (
    <section aria-label="Seans önerileri" aria-live="polite">
      {status === 'loading' && (
        <div role="status">
          <p className="mb-4 font-display text-lg font-semibold text-primary">
            Perde açılıyor…
          </p>
          <LoadingCards />
        </div>
      )}

      {status === 'error' && (
        <ErrorState
          title="Perde açılamadı"
          message={errorMessage ?? 'Öneriler getirilirken bir sorun oldu. Bir kez daha deneyelim mi?'}
          onRetry={onRetry}
        />
      )}

      {status === 'empty' && (
        <EmptyState
          title="Bu kriterlerle perde boş kaldı"
          hint={
            loosenNote ??
            'Bu kadar dar bir filtreyle eşleşme kalmadı. Kısıtları biraz gevşetmeyi deneyelim.'
          }
          action={
            loosenNote ? (
              <Button size="sm" onClick={onLoosen}>
                Kısıtları gevşet
              </Button>
            ) : undefined
          }
        />
      )}

      {status === 'ready' && (
        <>
          {undo && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-strong bg-surface-overlay px-4 py-3">
              <p className="text-sm text-secondary">{undo.label}</p>
              <Button size="sm" variant="ghost" onClick={undo.onUndo}>
                Geri al
              </Button>
            </div>
          )}
          <ol className="flex flex-col gap-4">
            {ranked.slice(0, limit).map((item, index) => (
              <li key={`${item.candidate.ref.kind}:${item.candidate.ref.id}`}>
                <CandidateCard
                  ranked={item}
                  rank={index + 1}
                  authed={authed}
                  onReject={onReject}
                  onWatched={onWatched}
                  onFavorite={onFavorite}
                  onWatchlist={onWatchlist}
                />
              </li>
            ))}
          </ol>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" onClick={onMore}>
                Daha fazla göster
              </Button>
            </div>
          )}
          <p className="mt-8 text-center text-xs leading-relaxed text-muted">
            Eşleşme yüzdesi; seçtiğin türler, ruh hâli vekilleri, izleyici puanı, dönem ve
            (varsa) geçmiş izleme alışkanlıklarınla hesaplanır. Ruh hâleti TMDB'de bir etiket
            değildir — tür, puan ve dönem ağırlıklarıyla dürüstçe eşleştirilir.
          </p>
        </>
      )}
    </section>
  )
}
