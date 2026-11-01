/**
 * Takip — saf izleme matematiği (SHARED_CONTRACTS §B/§E).
 * React ve depolama yok: her şey `episode_watched` / `follow_show`
 * olaylarından türetilir; geri almak = olayı silmek.
 */
import type { Interaction } from '../interactions';
import { isEpisodeAired } from '../../components/Tvs/EnhancedEpisodeCard';
import type { Episode } from '../../types/tvSeasons';

/** Sezon 0 = özel bölümler ("Özellikler"); numaralı sezondan ayrı tutulur. */
export const SPECIALS_SEASON = 0;

export function seasonLabel(seasonNumber: number): string {
  return seasonNumber === SPECIALS_SEASON ? 'Özellikler' : `${seasonNumber}. Sezon`;
}

// --- izlenmiş dizini -------------------------------------------------------

export interface WatchedIndex {
  isWatched(tvId: number, season: number, episode: number): boolean;
  /** Geri alma (undo) için olayın kendisi. */
  eventFor(tvId: number, season: number, episode: number): Interaction | undefined;
  episodesFor(tvId: number, season: number): Set<number>;
  seasonNumbers(tvId: number): number[];
}

/** tv → sezon → bölüm → olay haritası; yalnız `episode_watched` olayları. */
export function buildWatchedIndex(events: Interaction[]): WatchedIndex {
  const byShow = new Map<number, Map<number, Map<number, Interaction>>>();
  for (const e of events) {
    if (e.kind !== 'episode_watched' || e.target.kind !== 'tv') continue;
    if (e.season === undefined || e.episode === undefined) continue;
    let seasons = byShow.get(e.target.id);
    if (!seasons) byShow.set(e.target.id, (seasons = new Map()));
    let episodes = seasons.get(e.season);
    if (!episodes) seasons.set(e.season, (episodes = new Map()));
    episodes.set(e.episode, e); // logInteraction upsert'u sayesinde tek olay
  }
  return {
    isWatched: (tvId, season, episode) =>
      byShow.get(tvId)?.get(season)?.has(episode) ?? false,
    eventFor: (tvId, season, episode) => byShow.get(tvId)?.get(season)?.get(episode),
    episodesFor: (tvId, season) => new Set(byShow.get(tvId)?.get(season)?.keys() ?? []),
    seasonNumbers: (tvId) => [...(byShow.get(tvId)?.keys() ?? [])].sort((a, b) => a - b),
  };
}

/** Takip edilen diziler: tvId → en güncel `follow_show` olayı. */
export function followedShows(events: Interaction[]): Map<number, Interaction> {
  const follows = new Map<number, Interaction>();
  for (const e of events) {
    if (e.kind !== 'follow_show' || e.target.kind !== 'tv') continue;
    const prev = follows.get(e.target.id);
    if (!prev || e.at >= prev.at) follows.set(e.target.id, e);
  }
  return follows;
}

// --- sıradaki bölüm --------------------------------------------------------

export interface EpisodePlan {
  seasonNumber: number;
  episodes: Episode[];
}

export interface NextEpisode {
  season: number;
  episode: number;
  airDate: string | null;
  runtime: number | null;
  /** false → bölüm henüz yayınlanmadı ("yayın bekleniyor" modu). */
  aired: boolean;
}

/**
 * Sıradaki izlenmemiş bölüm: numaralı sezonlar küçükten büyüğe, bölümde
 * sırayla taranır; ilk izlenmemiş bölüm döner (boşluk varsa delikte durur,
 * yayınlanmamışsa `aired: false`). Sezon 0 (özellikler) asla sırayı
 * belirlemez. Tümü izlenmişse null — "hepsini izledin".
 */
export function nextUnwatchedEpisode(
  plans: EpisodePlan[],
  isWatched: (season: number, episode: number) => boolean,
): NextEpisode | null {
  const ordered = plans
    .filter((p) => p.seasonNumber !== SPECIALS_SEASON)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
  for (const plan of ordered) {
    const episodes = [...plan.episodes].sort((a, b) => a.episode_number - b.episode_number);
    for (const e of episodes) {
      if (isWatched(plan.seasonNumber, e.episode_number)) continue;
      return {
        season: plan.seasonNumber,
        episode: e.episode_number,
        airDate: e.air_date || null,
        runtime: e.runtime > 0 ? e.runtime : null,
        aired: isEpisodeAired(e),
      };
    }
  }
  return null;
}

// --- sezon tamamlanma matematiği -------------------------------------------

export interface SeasonProgress {
  watched: number;
  total: number;
  complete: boolean;
}

export function seasonProgress(watched: number, total: number): SeasonProgress {
  return { watched, total, complete: total > 0 && watched >= total };
}

/** Bir sezon planına göre izlenen/ toplam sayısı. */
export function planProgress(plan: EpisodePlan, index: WatchedIndex, tvId: number): SeasonProgress {
  let watched = 0;
  for (const e of plan.episodes) {
    if (index.isWatched(tvId, plan.seasonNumber, e.episode_number)) watched++;
  }
  return seasonProgress(watched, plan.episodes.length);
}

/** Yayınlanmamış bölüm asla toplu işaretlemeye girmez. */
export function airedEpisodes(episodes: Episode[]): Episode[] {
  return episodes.filter(isEpisodeAired);
}
