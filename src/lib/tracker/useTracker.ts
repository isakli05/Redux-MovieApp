/**
 * useTracker — Takip'in tek yazma kapısı. Tüm state etkileşim günlüğünden
 * türetilir (useInteractions); yazma logInteraction/removeInteraction ile
 * (SHARED_CONTRACTS §B). Girişte anonim kapsam hesap kapsamına eklemeli
 * birleştirilir (§A) — oturum başına hesap başına bir kez.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  listInteractions,
  logInteraction,
  mergeLocalIntoAccount,
  removeInteraction,
  useInteractions,
  type Interaction,
} from '../interactions';
import type { MediaRef } from '../mediaRef';
import { airedEpisodes, buildWatchedIndex, followedShows, type WatchedIndex } from './progress';
import { mergeLocalSpoilerPrefsIntoAccount } from './spoilers';
import type { Episode } from '../../types/tvSeasons';

/** Bu oturumda göç ettirilmiş hesaplar (sayfa başına bir kez yeter). */
const migratedFor = new Set<number>();

export interface TrackerApi {
  accountId: number | null;
  follows: Map<number, Interaction>;
  watched: WatchedIndex;
  isFollowing(tvId: number): boolean;
  followShow(ref: MediaRef): void;
  /** Geri almak = follow_show olayını silmek. */
  unfollowShow(tvId: number): void;
  setEpisodeWatched(ref: MediaRef, season: number, episode: number, watched: boolean): void;
  /** Sezonun YAYINLANMIŞ bölümlerini işaretler; özellikler (S0) yalnız
   *  paneldeki açık düğmeyle, asla otomatik işaretlenmez. */
  markSeasonWatched(ref: MediaRef, season: number, episodes: Episode[]): void;
  clearSeason(tvId: number, season: number): void;
}

export function useTracker(): TrackerApi {
  const { user } = useAuth();
  const accountId = user?.id ?? null;
  const events = useInteractions(accountId);

  useEffect(() => {
    if (accountId == null || migratedFor.has(accountId)) return;
    migratedFor.add(accountId);
    mergeLocalIntoAccount(accountId);
    mergeLocalSpoilerPrefsIntoAccount(accountId);
  }, [accountId]);

  const follows = useMemo(() => followedShows(events), [events]);
  const watched = useMemo(() => buildWatchedIndex(events), [events]);

  const followShow = useCallback(
    (ref: MediaRef) => {
      logInteraction({ kind: 'follow_show', target: ref, source: 'tracker' }, accountId);
    },
    [accountId],
  );

  const unfollowShow = useCallback(
    (tvId: number) => {
      const e = listInteractions(accountId).find(
        (it) => it.kind === 'follow_show' && it.target.kind === 'tv' && it.target.id === tvId,
      );
      if (e) removeInteraction(e.id, accountId);
    },
    [accountId],
  );

  const setEpisodeWatched = useCallback(
    (ref: MediaRef, season: number, episode: number, isWatched: boolean) => {
      if (isWatched) {
        logInteraction(
          { kind: 'episode_watched', target: ref, season, episode, source: 'tracker' },
          accountId,
        );
      } else {
        const e = listInteractions(accountId).find(
          (it) =>
            it.kind === 'episode_watched' &&
            it.target.kind === 'tv' &&
            it.target.id === ref.id &&
            it.season === season &&
            it.episode === episode,
        );
        if (e) removeInteraction(e.id, accountId); // undo
      }
    },
    [accountId],
  );

  const markSeasonWatched = useCallback(
    (ref: MediaRef, season: number, episodes: Episode[]) => {
      for (const ep of airedEpisodes(episodes)) {
        logInteraction(
          { kind: 'episode_watched', target: ref, season, episode: ep.episode_number, source: 'tracker' },
          accountId,
        );
      }
    },
    [accountId],
  );

  const clearSeason = useCallback(
    (tvId: number, season: number) => {
      for (const e of listInteractions(accountId)) {
        if (
          e.kind === 'episode_watched' &&
          e.target.kind === 'tv' &&
          e.target.id === tvId &&
          e.season === season
        ) {
          removeInteraction(e.id, accountId);
        }
      }
    },
    [accountId],
  );

  const isFollowing = useCallback((tvId: number) => follows.has(tvId), [follows]);

  return {
    accountId,
    follows,
    watched,
    isFollowing,
    followShow,
    unfollowShow,
    setEpisodeWatched,
    markSeasonWatched,
    clearSeason,
  };
}
