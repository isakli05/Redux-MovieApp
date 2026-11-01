/**
 * NextEpisodeCard — spoiler korumalı "sıradaki bölüm" kartı.
 * Her zaman güvenli metadata: sezon/bölüm numarası, yayın tarihi, süre.
 * Başlık yalnız dizi başına kalıcı "göster" tercihiyle DOM'a girer;
 * açılmadan önce gerçek başlık hiç render edilmez (blur-only değil).
 */
import { useAuth } from '../../hooks/useAuth';
import { useSpoilerRevealed } from '../../lib/tracker/spoilers';
import type { NextEpisode } from '../../lib/tracker/progress';
import { formatAirDate } from './TvProgressPanel';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base';

export interface NextEpisodeCardProps {
  tvId: number;
  /** null = dizi tamamı izlendi. */
  next: NextEpisode | null;
  /** Bölüm başlığı — spoiler; açılmadan asla DOM'a girmez. */
  title?: string | null;
  /** TMDB sezon isteği hâlâ sürüyorsa. */
  loading?: boolean;
  /** TMDB sezon isteği başarısızsa: nazik bozunma. */
  error?: boolean;
}

export default function NextEpisodeCard({ tvId, next, title, loading, error }: NextEpisodeCardProps) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useSpoilerRevealed(tvId, user?.id ?? null);

  return (
    <div
      role="group"
      aria-label="Sıradaki bölüm"
      className="rounded-lg border border-line bg-surface-overlay/40 p-4"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Sıradaki Bölüm</p>

      {loading && <p className="mt-2 text-sm text-secondary">Sıradaki bölüm hesaplanıyor…</p>}

      {!loading && error && (
        <p className="mt-2 text-sm text-secondary">
          Bölüm bilgisi şu an alınamıyor — izleme durumun güvende.
        </p>
      )}

      {!loading && !error && !next && (
        <div>
          <p className="mt-2 font-display text-base font-semibold text-primary">Hepsini izledin</p>
          <p className="mt-1 text-sm text-secondary">Yeni bir bölüm yayınlandığında burada görünecek.</p>
        </div>
      )}

      {!loading && !error && next && (
        <div className="mt-2">
          <p className="font-display text-xl font-semibold text-primary">
            S{next.season} · B{next.episode}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {next.aired ? formatAirDate(next.airDate) : `Yayınlanacak · ${formatAirDate(next.airDate)}`}
            {next.runtime ? <span className="text-muted"> · {next.runtime} dk</span> : null}
          </p>

          <div className="mt-3 flex min-h-9 items-center gap-2">
            {revealed ? (
              <>
                <span data-testid="spoiler-title" className="text-sm text-primary">
                  {title || 'Bölüm adı kayıtlı değil'}
                </span>
                <button
                  type="button"
                  onClick={() => setRevealed(false)}
                  className={`rounded text-xs text-muted underline-offset-2 hover:text-primary hover:underline ${FOCUS_RING}`}
                >
                  gizle
                </button>
              </>
            ) : (
              <>
                {/* Gerçek başlık DOM'da yok: blur dekorasyonu değil, kırmızı bant */}
                <span aria-hidden="true" className="select-none text-sm text-muted blur-[3px]">
                  ████████ ████
                </span>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className={`rounded border border-line-strong px-2 py-1 text-xs text-primary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent ${FOCUS_RING}`}
                >
                  göster
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
