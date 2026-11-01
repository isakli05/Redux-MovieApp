/**
 * /dna sayfa testi: sekmeler, radar görünümü, karşılaştırma akışı (cold-start),
 * olay kaldırarak yeniden kalibrasyon, gizlilik perdesi.
 * Popüler-havuz hook'ları mock'lanır (Discover testi kalıbı); meta önbelleği
 * tohumlanır, böylece sayfa ağ olmadan profili türetir.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { store } from '../../redux/store';
import { clearInteractions, listInteractions, logInteraction } from '../../lib/interactions';
import SinemaDna from '../../Pages/Experiences/SinemaDna';

const { poolState } = vi.hoisted(() => ({
  poolState: {
    movies: {
      page: 1,
      total_pages: 1,
      total_results: 6,
      results: [
        { id: 1, title: 'Yıldız Seferi', poster_path: '/a.jpg', popularity: 90, vote_count: 900, genre_ids: [878, 12] },
        { id: 2, title: 'Gülen Yüzler', poster_path: '/b.jpg', popularity: 80, vote_count: 800, genre_ids: [35] },
        { id: 3, title: 'Gece Kapısı', poster_path: '/c.jpg', popularity: 70, vote_count: 700, genre_ids: [27] },
        { id: 4, title: 'Derin Iz', poster_path: '/d.jpg', popularity: 60, vote_count: 600, genre_ids: [9648] },
        { id: 5, title: 'Kum Saati', poster_path: '/e.jpg', popularity: 50, vote_count: 500, genre_ids: [18] },
        { id: 6, title: 'Son Kurşun', poster_path: '/f.jpg', popularity: 40, vote_count: 400, genre_ids: [37] },
      ],
    },
    tvs: {
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [{ id: 101, name: 'Uzayın Çağı', poster_path: '/g.jpg', popularity: 85, vote_count: 850, genre_ids: [10759] }],
    },
  },
}));

const makeResult = (data: unknown) => ({ data, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() });

vi.mock('@api/index', () => ({
  useGetPopularMoviesQuery: () => makeResult(poolState.movies),
  useGetPopularTVShowsQuery: () => makeResult(poolState.tvs),
}));

const movieMeta = (id: number, genres: number[]) => ({
  key: `movie:${id}`,
  kind: 'movie' as const,
  id,
  genres,
  year: 2020,
  runtime: 120,
  voteAverage: 7,
});

function seedLog() {
  // İki karşılaştırma: kazananlar 878+12 ve 27; kaybedenler 35 ve 18.
  logInteraction({
    kind: 'comparison_win',
    target: { kind: 'movie', id: 1, title: 'Yıldız Seferi' },
    vs: { kind: 'movie', id: 2, title: 'Gülen Yüzler' },
    source: 'dna',
  });
  logInteraction({
    kind: 'comparison_win',
    target: { kind: 'movie', id: 3, title: 'Gece Kapısı' },
    vs: { kind: 'movie', id: 5, title: 'Kum Saati' },
    source: 'dna',
  });
}

function renderPage() {
  return render(
    <Provider store={store}>
      <SinemaDna />
    </Provider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  clearInteractions();
  seedLog();
  localStorage.setItem(
    'lmdb:dna:meta',
    JSON.stringify({
      'movie:1': movieMeta(1, [878, 12]),
      'movie:2': movieMeta(2, [35]),
      'movie:3': movieMeta(3, [27]),
      'movie:5': movieMeta(5, [18]),
    }),
  );
});

describe('SinemaDna sayfası', () => {
  it('başlık, sekmeler ve az-veri davetini gösterir', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Sinema DNA', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Profil' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Karşılaştır' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Veri & Gizlilik' })).toBeInTheDocument();
    // 2 sinyal < 8 → davet bandı.
    expect(screen.getByTestId('dna-lowdata')).toHaveTextContent('2 sinyal');
  });

  it('tohumlanmış günlükten radarı ve kanıt metnini üretir', async () => {
    renderPage();
    const radar = await screen.findByTestId('dna-radar');
    expect(radar).toBeInTheDocument();
    // Kanıt dürüstçe görünür: 2 karşılaştırma (kart başlığında ve eksen notlarında).
    expect(screen.getAllByText(/2 karşılaştırma/).length).toBeGreaterThan(0);
    // Radar eksen etiketleri (Türkçe tür adları) SVG içinde.
    expect(radar.textContent).toContain('Bilim Kurgu');
  });

  it('karşılaştırma sekmesi çift gösterir; seçim günlüğe yeni olay yazar (cold-start akışı)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Karşılaştır' }));

    const choices = await screen.findAllByTestId('compare-choice');
    expect(choices).toHaveLength(2);
    expect(listInteractions()).toHaveLength(2);

    await user.click(choices[0]);
    await waitFor(() => expect(listInteractions()).toHaveLength(3));
    const last = listInteractions()[2];
    expect(last.kind).toBe('comparison_win');
    expect(last.source).toBe('dna');
    expect(last.vs).toBeDefined();
    // Sayaç güncellenir ve yeni çift gelir.
    expect(await screen.findByText(/Yapılan karşılaştırma: 3/)).toBeInTheDocument();
    expect(screen.getAllByTestId('compare-choice')).toHaveLength(2);
  });

  it('veri sekmesi olayları listeler; kaldırınca liste küçülür', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Veri & Gizlilik' }));

    const list = await screen.findByTestId('dna-events-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: /^Kaldır:/ });
    await user.click(removeButtons[0]);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^Kaldır:/ })).toHaveLength(1));
    expect(listInteractions()).toHaveLength(1);
  });

  it('gizlilik perdesi profil içeriğini örter ve tıklayınca açar', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Veri & Gizlilik' }));
    await user.click(screen.getByRole('button', { name: /Gizlilik perdesi/ }));
    expect(screen.getByRole('button', { name: /Gizlilik perdesi: açık/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Profil' }));
    const veil = screen.getByTestId('dna-privacy-veil');
    expect(veil).toBeInTheDocument();
    await user.click(veil);
    // Perde kalkar (tercih kapanır) ve radar görünür kalır.
    expect(screen.queryByTestId('dna-privacy-veil')).not.toBeInTheDocument();
    expect(await screen.findByTestId('dna-radar')).toBeInTheDocument();
  });
});
