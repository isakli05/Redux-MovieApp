/**
 * TvProgressPanel — kendine yeterli sezon izleme paneli (Master, sezon detay
 * sayfasına monte eder). Dizi kimliği + sezon verisi alır; bölüm başına
 * izle/geri al, sezonu toplu işaretleme ve temizleme.
 *
 * Spoiler güvenliği tasarım gereği: panel yalnızca bölüm numarası, tarih ve
 * süre görüntüler — başlık/özet/görsel hiç render edilmez.
 */
import { Button } from '../ui/Button';
import { useTracker } from '../../lib/tracker/useTracker';
import { airedEpisodes, planProgress, seasonLabel, SPECIALS_SEASON } from '../../lib/tracker/progress';
import type { TvSeasons } from '../../types/tvSeasons';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base';

export function formatAirDate(airDate: string | null): string {
  if (!airDate) return 'Tarih belirsiz';
  const d = new Date(airDate);
  return Number.isNaN(d.getTime())
    ? 'Tarih belirsiz'
    : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export interface TvProgressPanelProps {
  tvId: number;
  /** TMDB sezon detayı (`episodes` dahil). */
  season: TvSeasons;
  className?: string;
}

export default function TvProgressPanel({ tvId, season, className = '' }: TvProgressPanelProps) {
  const { watched, setEpisodeWatched, markSeasonWatched, clearSeason } = useTracker();
  const specials = season.season_number === SPECIALS_SEASON;
  const progress = planProgress(
    { seasonNumber: season.season_number, episodes: season.episodes ?? [] },
    watched,
    tvId,
  );
  const pct = progress.total > 0 ? Math.round((progress.watched / progress.total) * 100) : 0;
  const episodes = [...(season.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number);
  const markable = airedEpisodes(episodes).filter((e) => !watched.isWatched(tvId, season.season_number, e.episode_number));

  return (
    <section
      aria-label={`${seasonLabel(season.season_number)} izleme takibi`}
      className={`rounded-lg border border-line bg-surface-base p-4 sm:p-6 ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-primary">
            {seasonLabel(season.season_number)}
          </h3>
          <p className="mt-1 text-sm text-secondary" aria-live="polite">
            {progress.watched}/{progress.total} bölüm izlendi
            {progress.complete ? ' — tamamlandı' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {markable.length > 0 && (
            <Button
              size="sm"
              onClick={() =>
                markSeasonWatched({ kind: 'tv', id: tvId }, season.season_number, episodes)
              }
            >
              {specials ? 'Özel Bölümleri İşaretle' : 'Sezonu İşaretle'}
            </Button>
          )}
          {progress.watched > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clearSeason(tvId, season.season_number)}
            >
              Temizle
            </Button>
          )}
        </div>
      </header>

      {/* Sezon ilerleme çubuğu */}
      <div
        role="progressbar"
        aria-valuenow={progress.watched}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-label={`${seasonLabel(season.season_number)} ilerlemesi`}
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-overlay"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-250 ease-cine motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 divide-y divide-line">
        {episodes.map((ep) => {
          const aired = airedEpisodes([ep]).length > 0;
          const isWatched = watched.isWatched(tvId, season.season_number, ep.episode_number);
          return (
            <li key={ep.id ?? ep.episode_number} className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 font-display text-sm font-semibold text-primary">
                {specials ? `Ö${ep.episode_number}` : `B${ep.episode_number}`}
              </span>
              <span className="min-w-0 flex-1 text-sm text-secondary">
                {formatAirDate(ep.air_date || null)}
                {ep.runtime > 0 ? <span className="text-muted"> · {ep.runtime} dk</span> : null}
                {!aired && (
                  <span className="ml-2 rounded border border-line px-1.5 py-0.5 text-xs text-muted">
                    Yayınlanmadı
                  </span>
                )}
              </span>
              <button
                type="button"
                aria-pressed={isWatched}
                aria-label={`S${season.season_number}B${ep.episode_number} izlendi olarak işaretle`}
                disabled={!aired}
                title={aired ? undefined : 'Henüz yayınlanmadı'}
                onClick={() =>
                  setEpisodeWatched(
                    { kind: 'tv', id: tvId },
                    season.season_number,
                    ep.episode_number,
                    !isWatched,
                  )
                }
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ease-cine disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING} ${
                  isWatched
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line-strong text-muted hover:border-accent hover:text-accent'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
