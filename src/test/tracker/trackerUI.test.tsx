/**
 * Takip UI etkileşimleri: takip et/bırak (olay silme = geri alma), bölüm
 * işaretleme + geri alma, sezonu toplu işaretleme (yayınlanmamış hariç),
 * özellikler etiketi, spoiler sınırı (açıklanmadan başlık DOM'da yok),
 * göster tercihinin kalıcılığı, panel ilerlemesi ve anonim→hesap göçü.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../redux/store';
import {
  listInteractions,
  logInteraction,
  mergeLocalIntoAccount,
} from '../../lib/interactions';
import { buildWatchedIndex, followedShows } from '../../lib/tracker/progress';
import { setRevealed } from '../../lib/tracker/spoilers';
import TvFollowButton from '../../components/Tracker/TvFollowButton';
import TvProgressPanel from '../../components/Tracker/TvProgressPanel';
import NextEpisodeCard from '../../components/Tracker/NextEpisodeCard';
import FollowedShowCard from '../../components/Tracker/FollowedShowCard';
import type { Episode, TvSeasons } from '../../types/tvSeasons';
import type { Season } from '../../types/tvsDetails';

const tvMocks = vi.hoisted(() => ({
  detail: { data: undefined as unknown, isLoading: false, isError: false },
  season: { data: undefined as unknown, isLoading: false, isError: false },
}));
vi.mock('@api/endpoints/tv.endpoints', () => ({
  useGetTVShowDetailsQuery: () => tvMocks.detail,
  useGetTVSeasonDetailsQuery: () => tvMocks.season,
}));

const PAST = '2020-01-01';

const ep = (n: number, airDate: string, runtime = 45): Episode => ({
  air_date: airDate,
  episode_number: n,
  crew: [],
  guest_stars: [],
  id: n,
  name: `Bölüm ${n}`,
  overview: 'spoiler özet',
  production_code: '',
  season_number: 1,
  still_path: '',
  vote_average: 0,
  vote_count: 0,
  runtime,
});

const season = (seasonNumber: number, episodes: Episode[]): TvSeasons => ({
  _id: `s${seasonNumber}`,
  air_date: episodes[0]?.air_date ?? '',
  episodes,
  name: `${seasonNumber}. Sezon`,
  overview: '',
  id: seasonNumber,
  poster_path: '',
  season_number: seasonNumber,
});

const seasonSummary = (n: number, count: number): Season => ({
  air_date: PAST,
  episode_count: count,
  id: n,
  name: `${n}. Sezon`,
  overview: '',
  poster_path: '',
  season_number: n,
});

function ui(node: ReactNode) {
  return render(
    <Provider store={store}>
      <MemoryRouter>{node}</MemoryRouter>
    </Provider>,
  );
}

const tvEvents = () => listInteractions().filter((e) => e.target.kind === 'tv');

beforeEach(() => {
  localStorage.clear();
  tvMocks.detail = { data: undefined, isLoading: false, isError: false };
  tvMocks.season = { data: undefined, isLoading: false, isError: false };
});

describe('TvFollowButton', () => {
  it('follows on click (follow_show event) and unfollows by removing it', async () => {
    const user = userEvent.setup();
    ui(<TvFollowButton tvId={1399} title="Severance" />);
    const btn = screen.getByRole('button', { name: 'Takip Et' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    await user.click(btn);
    const events = tvEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: 'follow_show', target: { kind: 'tv', id: 1399, title: 'Severance' } });

    const following = screen.getByRole('button', { name: 'Takiptesin' });
    expect(following).toHaveAttribute('aria-pressed', 'true');

    await user.click(following); // geri alma = olayı silmek
    expect(tvEvents()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Takip Et' })).toBeTruthy();
  });
});

describe('TvProgressPanel', () => {
  it('marks an episode watched, undoes it by removing the event', async () => {
    const user = userEvent.setup();
    ui(<TvProgressPanel tvId={1399} season={season(1, [ep(1, PAST), ep(2, PAST)])} />);
    expect(screen.getByText('0/2 bölüm izlendi')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'S1B1 izlendi olarak işaretle' }));
    expect(screen.getByText('1/2 bölüm izlendi')).toBeTruthy();
    expect(tvEvents()[0]).toMatchObject({ kind: 'episode_watched', season: 1, episode: 1 });

    await user.click(screen.getByRole('button', { name: 'S1B1 izlendi olarak işaretle' }));
    expect(screen.getByText('0/2 bölüm izlendi')).toBeTruthy();
    expect(tvEvents()).toHaveLength(0);
  });

  it('marks a whole season but never unaired episodes', async () => {
    const user = userEvent.setup();
    ui(<TvProgressPanel tvId={1399} season={season(1, [ep(1, PAST), ep(2, PAST), ep(3, '2030-01-01')])} />);

    await user.click(screen.getByRole('button', { name: 'Sezonu İşaretle' }));
    expect(screen.getByText('2/3 bölüm izlendi')).toBeTruthy();
    const episodes = tvEvents().map((e) => e.episode);
    expect(episodes).toEqual([1, 2]); // gelecekteki B3 asla işaretlenmez

    // Yayınlanmamış bölümün düğmesi etkisiz
    expect(screen.getByRole('button', { name: 'S1B3 izlendi olarak işaretle' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Temizle' }));
    expect(tvEvents()).toHaveLength(0);
  });

  it('labels season 0 as Özellikler with separate numbering and explicit copy', async () => {
    const user = userEvent.setup();
    ui(<TvProgressPanel tvId={1399} season={season(0, [ep(1, PAST), ep(2, PAST)])} />);

    expect(screen.getByText('Özellikler')).toBeTruthy();
    expect(screen.getByText('Ö1')).toBeTruthy(); // numaralandırma ayrı
    expect(screen.queryByText('B1')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Özel Bölümleri İşaretle' }));
    expect(screen.getByText(/2\/2 bölüm izlendi — tamamlandı/)).toBeTruthy();
  });

  it('never renders episode titles or overviews (spoiler-safe by construction)', () => {
    ui(<TvProgressPanel tvId={1399} season={season(1, [ep(1, PAST)])} />);
    expect(screen.queryByText('Bölüm 1')).toBeNull();
    expect(screen.queryByText('spoiler özet')).toBeNull();
  });
});

describe('NextEpisodeCard — spoiler sınırı', () => {
  const next = { season: 2, episode: 4, airDate: '2026-12-01', runtime: 45, aired: true };

  it('does not render the episode title until explicitly revealed', async () => {
    const user = userEvent.setup();
    ui(<NextEpisodeCard tvId={1399} next={next} title="Kıyamet Gecesi" />);

    expect(screen.getByText('S2 · B4')).toBeTruthy();
    expect(screen.queryByText('Kıyamet Gecesi')).toBeNull(); // DOM'da hiç yok
    expect(screen.queryByTestId('spoiler-title')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'göster' }));
    expect(screen.getByTestId('spoiler-title')).toHaveTextContent('Kıyamet Gecesi');
  });

  it('persists the reveal per show and re-hides on demand', async () => {
    const user = userEvent.setup();
    const { unmount } = ui(<NextEpisodeCard tvId={1399} next={next} title="Kıyamet Gecesi" />);
    await user.click(screen.getByRole('button', { name: 'göster' }));
    unmount();

    ui(<NextEpisodeCard tvId={1399} next={next} title="Kıyamet Gecesi" />);
    expect(screen.getByTestId('spoiler-title')).toHaveTextContent('Kıyamet Gecesi'); // kalıcı

    await user.click(screen.getByRole('button', { name: 'gizle' }));
    expect(screen.queryByText('Kıyamet Gecesi')).toBeNull();
  });

  it('reveals independently per show', () => {
    setRevealed(1399, true);
    ui(
      <>
        <NextEpisodeCard tvId={1399} next={next} title="A Başlığı" />
        <NextEpisodeCard tvId={46648} next={next} title="B Başlığı" />
      </>,
    );
    expect(screen.getByText('A Başlığı')).toBeTruthy();
    expect(screen.queryByText('B Başlığı')).toBeNull();
  });

  it('shows a waiting state for unaired and a done state when null', () => {
    ui(<NextEpisodeCard tvId={1399} next={{ ...next, aired: false, airDate: '2030-01-01' }} title="X" />);
    expect(screen.getByText(/Yayınlanacak/)).toBeTruthy();
    expect(screen.queryByText('X')).toBeNull();

    ui(<NextEpisodeCard tvId={46648} next={null} />);
    expect(screen.getByText('Hepsini izledin')).toBeTruthy();
  });
});

describe('FollowedShowCard', () => {
  it('renders per-season progress bars from log events, specials listed separately', async () => {
    const user = userEvent.setup();
    logInteraction({ kind: 'follow_show', target: { kind: 'tv', id: 1399, title: 'Yedek Ad' }, source: 'tracker' });
    for (const e of [1, 2, 3]) {
      logInteraction({ kind: 'episode_watched', target: { kind: 'tv', id: 1399 }, season: 1, episode: e, source: 'tracker' });
    }
    tvMocks.detail = {
      data: {
        name: 'Severance',
        poster_path: null,
        seasons: [seasonSummary(1, 10), seasonSummary(0, 2)],
      },
      isLoading: false,
      isError: false,
    };
    tvMocks.season = {
      data: { episodes: Array.from({ length: 10 }, (_, i) => ep(i + 1, PAST)) },
      isLoading: false,
      isError: false,
    };

    ui(<FollowedShowCard tvId={1399} fallbackTitle="Yedek Ad" />);

    // Sezon çubukları günlükteki olaylardan
    const s1 = screen.getByRole('progressbar', { name: /1\. Sezon ilerlemesi/ });
    expect(s1).toHaveAttribute('aria-valuenow', '3');
    expect(s1).toHaveAttribute('aria-valuemax', '10');
    expect(screen.getByText('3/10')).toBeTruthy();
    expect(screen.getByText('Özellikler')).toBeTruthy(); // ayrı, açık etiketli

    // Sıradaki bölüm: 1-3 izlenmiş → B4 (güvenli metadata görünür, başlık kapalı)
    expect(screen.getByText('S1 · B4')).toBeTruthy();
    expect(screen.queryByTestId('spoiler-title')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Takibi Bırak' }));
    expect(tvEvents().filter((e) => e.kind === 'follow_show')).toHaveLength(0);
  });

  it('degrades gracefully when TMDB detail fails — progress still readable', () => {
    logInteraction({ kind: 'follow_show', target: { kind: 'tv', id: 1399, title: 'Yedek Ad' }, source: 'tracker' });
    logInteraction({ kind: 'episode_watched', target: { kind: 'tv', id: 1399 }, season: 1, episode: 1, source: 'tracker' });
    tvMocks.detail = { data: undefined, isLoading: false, isError: true };

    ui(<FollowedShowCard tvId={1399} fallbackTitle="Yedek Ad" />);
    expect(screen.getByText('Yedek Ad')).toBeTruthy(); // günlükteki yedek başlık
    expect(screen.getByText(/Dizi bilgileri yüklenemedi/)).toBeTruthy();
  });
});

describe('anonim → hesap göçü (eklemeli)', () => {
  it('tracker state derives from the merged account log without losing local', () => {
    logInteraction({ kind: 'follow_show', target: { kind: 'tv', id: 1399 }, source: 'tracker' });
    logInteraction({ kind: 'episode_watched', target: { kind: 'tv', id: 1399 }, season: 1, episode: 1, source: 'tracker' });

    expect(mergeLocalIntoAccount(7)).toBe(2);
    const acct = listInteractions(7);
    expect(followedShows(acct).size).toBe(1);
    expect(buildWatchedIndex(acct).isWatched(1399, 1, 1)).toBe(true);
    // lokal kapsam korunur, asla ezilmez
    expect(listInteractions()).toHaveLength(2);
  });
});
