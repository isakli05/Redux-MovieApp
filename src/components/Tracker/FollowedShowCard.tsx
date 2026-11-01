/**
 * FollowedShowCard — takip listesindeki dizi kartı: poster, sezon ilerleme
 * çubukları, spoiler korumalı sıradaki bölüm kartı, takibi bırak.
 * RTK Query ile dizi detayını çeker; istek başarısızsa günlükteki
 * başlık/afişle ve salt izleme sayılarıyla nazikçe bozunur (çevrimdışı).
 */
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useGetTVSeasonDetailsQuery, useGetTVShowDetailsQuery } from '@api/endpoints/tv.endpoints';
import { useTracker } from '../../lib/tracker/useTracker';
import { nextUnwatchedEpisode, seasonLabel, SPECIALS_SEASON } from '../../lib/tracker/progress';
import NextEpisodeCard from './NextEpisodeCard';
import { getImageUrl } from '../../utils/image.utils';

export interface FollowedShowCardProps {
  tvId: number;
  /** Günlükteki follow_show olayından gelen yedek başlık/afiş (çevrimdışı). */
  fallbackTitle?: string;
  fallbackPosterPath?: string | null;
}

function SeasonBar({
  tvId,
  seasonNumber,
  name,
  watched,
  total,
}: {
  tvId: number;
  seasonNumber: number;
  name: string;
  watched: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
  const complete = total > 0 && watched >= total;
  return (
    <li>
      <Link
        to={`/tv/${tvId}/season/${seasonNumber}`}
        className="group block rounded px-1 py-1 transition-colors duration-150 ease-cine hover:bg-surface-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className={complete ? 'text-muted line-through decoration-accent/70' : 'text-secondary group-hover:text-primary'}>
            {seasonLabel(seasonNumber)}
          </span>
          <span className="tabular-nums text-muted">
            {watched}/{total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`${name} ${seasonLabel(seasonNumber)} ilerlemesi`}
          aria-valuenow={watched}
          aria-valuemin={0}
          aria-valuemax={total}
          className="mt-1 h-1 overflow-hidden rounded-full bg-surface-overlay"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-250 ease-cine motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Link>
    </li>
  );
}

export default function FollowedShowCard({ tvId, fallbackTitle, fallbackPosterPath }: FollowedShowCardProps) {
  const { watched, unfollowShow } = useTracker();
  const { data: detail, isLoading, isError } = useGetTVShowDetailsQuery(String(tvId), { skip: !tvId });

  const name = detail?.name || fallbackTitle || 'Dizi';
  const posterPath = detail?.poster_path ?? fallbackPosterPath ?? null;

  const seasons = (detail?.seasons ?? [])
    .slice()
    .sort((a, b) => a.season_number - b.season_number);
  const numbered = seasons.filter((s) => s.season_number !== SPECIALS_SEASON && s.episode_count > 0);
  const specials = seasons.filter((s) => s.season_number === SPECIALS_SEASON && s.episode_count > 0);

  // shortcut: yalnız ilk eksik sezondan bölüm verisi çekilir; o sezon yayın
  // beklerken sonraki sezonda delik varsa kart "yayınlanacak" gösterir.
  const firstIncomplete = numbered.find(
    (s) => watched.episodesFor(tvId, s.season_number).size < s.episode_count,
  );
  const scanSeason = firstIncomplete?.season_number;
  const { data: scanDetail, isLoading: scanLoading, isError: scanError } = useGetTVSeasonDetailsQuery(
    { tvId: String(tvId), seasonNumber: scanSeason ?? -1 },
    { skip: scanSeason === undefined },
  );

  const next = scanDetail?.episodes
    ? nextUnwatchedEpisode(
        [{ seasonNumber: scanSeason ?? -1, episodes: scanDetail.episodes }],
        (s, e) => watched.isWatched(tvId, s, e),
      )
    : null;
  const nextTitle = next
    ? scanDetail?.episodes?.find((e) => e.episode_number === next.episode)?.name ?? null
    : null;

  return (
    <article className="flex gap-4 rounded-lg border border-line bg-surface-base p-4">
      <Link
        to={`/tv/${tvId}`}
        className="shrink-0 self-start rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`${name} sayfası`}
      >
        {posterPath ? (
          <img
            src={getImageUrl(posterPath, 'w185')}
            alt=""
            className="h-32 w-24 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-32 w-24 items-center justify-center rounded border border-line bg-surface-overlay text-2xl text-muted" aria-hidden="true">
            📺
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/tv/${tvId}`}
              className="font-display text-lg font-semibold text-primary transition-colors duration-150 ease-cine hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {name}
            </Link>
            {isError && (
              <p className="mt-0.5 text-xs text-muted">
                Dizi bilgileri yüklenemedi — ilerleme günlükten okunuyor.
              </p>
            )}
            {isLoading && <p className="mt-0.5 text-xs text-muted">Yükleniyor…</p>}
          </div>
          <Button size="sm" variant="ghost" onClick={() => unfollowShow(tvId)}>
            Takibi Bırak
          </Button>
        </div>

        <div className="mt-3">
          <NextEpisodeCard
            tvId={tvId}
            next={next}
            title={nextTitle}
            loading={scanSeason !== undefined && scanLoading}
            error={scanSeason !== undefined && !scanLoading && scanError}
          />
        </div>

        {(numbered.length > 0 || specials.length > 0) && (
          <ul className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {numbered.map((s) => (
              <SeasonBar
                key={s.id}
                tvId={tvId}
                seasonNumber={s.season_number}
                name={name}
                watched={watched.episodesFor(tvId, s.season_number).size}
                total={s.episode_count}
              />
            ))}
            {/* Özellikler (S0) numaralı sezonlardan ayrı, en sonda */}
            {specials.map((s) => (
              <SeasonBar
                key={s.id}
                tvId={tvId}
                seasonNumber={s.season_number}
                name={name}
                watched={watched.episodesFor(tvId, s.season_number).size}
                total={s.episode_count}
              />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
