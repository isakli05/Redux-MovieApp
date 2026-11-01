/**
 * LMDB Seans sayfası — UI etkileşim testleri.
 *
 * Veri sınırı ('@/lib/seans/api') mock'lanır; puanlama, günlük yazmaları ve
 * gevşetme mantığı GERÇEK modüller üzerinden koşar. Sıralama/determinizm
 * ayrıca rank.test.ts'te birim testlidir.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { listInteractions } from '@/lib/interactions';
import { SeansApiError } from '@/lib/seans/api';
import type { SeansCandidate } from '@/lib/seans/types';

const state = vi.hoisted(() => ({
  authed: false,
  pool: vi.fn(),
  genres: vi.fn(),
  catalog: vi.fn(),
  seed: vi.fn(),
  genreIdsOf: vi.fn(),
  addFavorite: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: state.authed ? { id: 42, username: 'isa', name: 'isa', avatar: null } : null,
    isLoading: false,
    isAuthenticated: state.authed,
    bootstrapped: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/useRegion', () => ({
  useRegion: () => ({
    region: 'TR',
    setRegion: vi.fn(),
    regions: [{ iso_3166_1: 'TR', english_name: 'Turkey', native_name: 'Türkiye' }],
  }),
}));

vi.mock('@/api/user.api', () => ({
  useAddFavoriteMutation: () => [state.addFavorite],
  useSetWatchlistMutation: () => [vi.fn()],
}));

vi.mock('@/lib/seans/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/seans/api')>();
  return {
    ...actual,
    fetchCandidatePool: (...args: unknown[]) => state.pool(...args),
    fetchGenres: (...args: unknown[]) => state.genres(...args),
    fetchProviderCatalog: (...args: unknown[]) => state.catalog(...args),
    fetchSeedInfo: (...args: unknown[]) => state.seed(...args),
    fetchGenreIdsOf: (...args: unknown[]) => state.genreIdsOf(...args),
  };
});

import Seans from '@/Pages/Experiences/Seans';

const candidate = (overrides: Partial<SeansCandidate> & { id: number; title: string }): SeansCandidate => ({
  ref: { kind: 'movie', id: overrides.id, title: overrides.title },
  posterPath: null,
  backdropPath: null,
  voteAverage: 7,
  voteCount: 100,
  releaseDate: '2020-01-01',
  genreIds: [35],
  popularity: 10,
  ...overrides,
});

const POOL: SeansCandidate[] = [
  candidate({ id: 1, title: 'Kahkaha Ustası', genreIds: [35], voteAverage: 8.2, voteCount: 2000, releaseDate: '2023-05-05' }),
  candidate({ id: 2, title: 'Gülünç Sır', genreIds: [35, 9648], voteAverage: 7.1, voteCount: 300, releaseDate: '2018-03-03' }),
  candidate({ id: 3, title: 'Sakin Aile', genreIds: [10751, 18], voteAverage: 6.2, voteCount: 90, releaseDate: '2015-02-02' }),
];

const GENRES: Record<number, string> = { 35: 'Komedi', 10751: 'Aile', 18: 'Dram', 9648: 'Gizem' };

function setup(url = '/seans') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Seans />
    </MemoryRouter>,
  );
}

/** Tüm adımları tıklayarak sonuç ekranına kadar götürür. */
async function walkToResults(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Film'));
  await user.click(screen.getByRole('button', { name: 'Devam' }));

  await user.click(screen.getByText('Kahkaha garantili'));
  await user.click(screen.getByRole('button', { name: 'Devam' }));

  await user.click(screen.getByText('Kısa'));
  await user.click(screen.getByRole('button', { name: 'Devam' }));

  // Türler adımı: ruh hâli vekilleri (Komedi, Aile) ön seçili gelir.
  await user.click(screen.getByRole('button', { name: 'Devam' }));

  await user.click(screen.getByText('Yeni keşifler'));
  await user.click(screen.getByRole('button', { name: 'Devam' }));

  await user.click(screen.getByText('Netflix'));
  await user.click(screen.getByRole('button', { name: 'Seansı oluştur' }));
}

beforeEach(() => {
  localStorage.clear();
  state.authed = false;
  state.pool.mockReset().mockResolvedValue(POOL);
  state.genres.mockReset().mockResolvedValue(GENRES);
  state.catalog.mockReset().mockResolvedValue([
    { id: 8, name: 'Netflix' },
    { id: 337, name: 'Disney+' },
  ]);
  state.seed.mockReset().mockResolvedValue(null);
  state.genreIdsOf.mockReset().mockResolvedValue([]);
  state.addFavorite.mockReset().mockImplementation(() => ({
    unwrap: async () => ({ success: true }),
  }));
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
});

describe('Seans sayfası', () => {
  it('altı adımlı yolculuk: cevaplar toplanır, gerçek sebeplerle sıralı adaylar döner', async () => {
    const user = userEvent.setup();
    setup();

    // Adım 0 — seçim yapılmadan Devam kapalıdır.
    expect(screen.getByRole('heading', { name: 'Film mi, dizi mi?' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Devam' })).toBeDisabled();

    await walkToResults(user);

    // Sonuçlar deterministik sıradadır ve gerçek kriterlerle açıklanır.
    expect(await screen.findByRole('heading', { name: 'Perden için adaylar' })).toBeVisible();
    // aday kartları, DNA profili gibi opsiyonel asenkron ağırlıklar yüklendikten sonra gelir
    const first = (await screen.findByText('Kahkaha Ustası')).closest('article') as HTMLElement;
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
    expect(within(first).getByText(/Seçtiğin türlerden/)).toBeVisible();
    expect(within(first).getByText(/Kahkaha garantili.*ruh hâli/i)).toBeVisible();
    expect(within(first).getByText(/yayın servislerinde/)).toBeVisible();
    expect(within(first).getByText(/süre aralığında/)).toBeVisible();

    // Anonim oturumda hesap kayıt düğmeleri yoktur; seans yine de çalışır.
    expect(screen.queryByRole('button', { name: 'Favorilere ekle' })).not.toBeInTheDocument();
  });

  it('"bu değil" reddi günlüğe yazar, kartı değiştirir; geri alma ikisini de döndürür', async () => {
    const user = userEvent.setup();
    setup();
    await walkToResults(user);
    await screen.findByText('Kahkaha Ustası');

    // aday kartları, DNA profili gibi opsiyonel asenkron ağırlıklar yüklendikten sonra gelir
    const first = (await screen.findByText('Kahkaha Ustası')).closest('article') as HTMLElement;
    await user.click(within(first).getByRole('button', { name: 'Bu değil' }));

    // Kart gider, ikinci aday 1 numaraya çıkar, geri alma çubuğu görünür.
    expect(screen.queryByText('Kahkaha Ustası')).not.toBeInTheDocument();
    expect(screen.getByText('Gülünç Sır').closest('article')).toBeVisible();
    expect(screen.getByText(/“Kahkaha Ustası” reddedildi/)).toBeVisible();
    expect(listInteractions().some((e) => e.kind === 'seans_reject' && e.target.id === 1)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Geri al' }));
    expect(screen.getByText('Kahkaha Ustası')).toBeVisible();
    expect(listInteractions().some((e) => e.kind === 'seans_reject' && e.target.id === 1)).toBe(false);
  });

  it('"izledim" seen olayı yazar, kısa geçmişe ekler ve geri alınabilir', async () => {
    const user = userEvent.setup();
    setup();
    await walkToResults(user);
    await screen.findByText('Kahkaha Ustası');

    // aday kartları, DNA profili gibi opsiyonel asenkron ağırlıklar yüklendikten sonra gelir
    const first = (await screen.findByText('Kahkaha Ustası')).closest('article') as HTMLElement;
    await user.click(within(first).getByRole('button', { name: 'İzledim' }));

    expect(screen.queryByText('Kahkaha Ustası')).not.toBeInTheDocument();
    expect(listInteractions().some((e) => e.kind === 'seen' && e.target.id === 1)).toBe(true);
    const stored = JSON.parse(localStorage.getItem('lmdb:seans:history') ?? '[]');
    expect(stored).toEqual([expect.objectContaining({ key: 'movie:1', title: 'Kahkaha Ustası' })]);

    await user.click(screen.getByRole('button', { name: 'Geri al' }));
    expect(screen.getByText('Kahkaha Ustası')).toBeVisible();
    expect(listInteractions().some((e) => e.kind === 'seen' && e.target.id === 1)).toBe(false);
  });

  it('girişli kullanıcı adayı favorilere kaydeder', async () => {
    state.authed = true;
    const user = userEvent.setup();
    setup();
    await walkToResults(user);
    await screen.findByText('Kahkaha Ustası');

    // aday kartları, DNA profili gibi opsiyonel asenkron ağırlıklar yüklendikten sonra gelir
    const first = (await screen.findByText('Kahkaha Ustası')).closest('article') as HTMLElement;
    await user.click(within(first).getByRole('button', { name: 'Favorilere ekle' }));

    expect(state.addFavorite).toHaveBeenCalledWith({ mediaType: 'movie', mediaId: 1, favorite: true });
    expect(await within(first).findByText('Favorilerde')).toBeVisible();
    // Girişliyken 'like' olayı hesap kapsamına yazılır (SHARED_CONTRACTS §B).
    expect(listInteractions(42).some((e) => e.kind === 'like' && e.target.id === 1)).toBe(true);
  });

  it('boş sonuç: kısıt gevşetme önerisi sunar, tıklayınca yeniden tarar', async () => {
    const user = userEvent.setup();
    state.pool.mockResolvedValueOnce([]);
    setup();
    await walkToResults(user);

    expect(await screen.findByText('Bu kriterlerle perde boş kaldı')).toBeVisible();
    // Servis filtresi seçiliyken ilk öneri servis filtresini kaldırmaktır.
    expect(screen.getByText(/Yayın servisi filtresini kaldıralım/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Kısıtları gevşet' }));
    expect(await screen.findByText('Kahkaha Ustası')).toBeVisible();
    expect(state.pool).toHaveBeenCalledTimes(2);
  });

  it('hata durumu: mesaj ve yeniden dene düğmesi gösterir, tıklayınca kurtarır', async () => {
    const user = userEvent.setup();
    state.pool.mockRejectedValueOnce(new SeansApiError('Rate limit exceeded', 429, 26));
    setup();
    await walkToResults(user);

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByText('Perde açılamadı')).toBeVisible();
    expect(screen.getByText(/Rate limit exceeded/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(await screen.findByText('Kahkaha Ustası')).toBeVisible();
  });

  it('seed parametresi: tür/süre hazır gelir, banner gösterilir, adaylar devam eder', async () => {
    const user = userEvent.setup();
    state.seed.mockResolvedValue({
      ref: { kind: 'movie', id: 550, title: 'Fight Club', posterPath: null },
      genreIds: [18, 35],
      minutes: 139,
    });
    setup('/seans?seed=movie:550');

    // Seed bilgisinin gelmesiyle doğrudan ruh hâli adımına atlanır.
    expect(await screen.findByText(/“Fight Club” ile başladın/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Nasıl bir şey istiyorsun?' })).toBeVisible();

    await user.click(screen.getByText('Yüksek gerilim'));
    await user.click(screen.getByRole('button', { name: 'Devam' }));
    await user.click(screen.getByRole('button', { name: 'Devam' })); // süre: 139 dk → uzun ön seçili
    await user.click(screen.getByRole('button', { name: 'Devam' })); // türler: seed türleri ön seçili
    await user.click(screen.getByText('Bilinen sular'));
    await user.click(screen.getByRole('button', { name: 'Devam' }));
    await user.click(screen.getByRole('button', { name: 'Seansı oluştur' }));

    expect(await screen.findByText('Kahkaha Ustası')).toBeVisible();
    // Seed ile ortak tür (Komedi=35) gerçekten eşleşirse sebep olarak yazılır.
    // aday kartları, DNA profili gibi opsiyonel asenkron ağırlıklar yüklendikten sonra gelir
    const first = (await screen.findByText('Kahkaha Ustası')).closest('article') as HTMLElement;
    expect(within(first).getByText(/Başlangıç yapımıyla ortak türler/)).toBeVisible();
  });
});
