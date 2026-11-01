import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GunlukBilmece from '../../Pages/Experiences/GunlukBilmece';
import { fetchDailyMystery, submitGuess } from '../../lib/mystery/api';

vi.mock('../../lib/mystery/api', () => ({
  fetchDailyMystery: vi.fn(),
  submitGuess: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false, isAuthenticated: false }),
}));

const CLUES = [
  { id: 'era-genre', label: 'Tür ve Dönem', text: 'Film • 1990’lar • Dram, Gerilim' },
  { id: 'initials', label: 'Baş Harfler', text: 'Yönetmen: D. F. • Başrol: B. P., E. N.' },
  { id: 'keywords', label: 'Konu Kavramları', text: 'anarchy • insomnia • nihilism' },
  { id: 'cast', label: 'Başroller', text: 'Brad Pitt, Edward Norton' },
  { id: 'year-format', label: 'Yıl ve Biçim', text: 'Yayın yılı: 1999 • 139 dakika' },
];

const ANSWER = {
  mediaType: 'movie' as const,
  id: 550,
  title: 'Dövüş Kulübü',
  year: 1999,
  posterPath: null,
  creditsLine: 'Yönetmen: David Fincher',
  overview: 'Uykusuzluk çeken bir adamın garip bir arkadaşı olur.',
};

const mockedFetch = vi.mocked(fetchDailyMystery);
const mockedGuess = vi.mocked(submitGuess);

function renderPage() {
  return render(
    <MemoryRouter>
      <GunlukBilmece />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockedFetch.mockResolvedValue({ date: '2026-11-01', mediaType: 'movie', attemptsAllowed: 6, clues: CLUES });
});

describe('GunlukBilmece page', () => {
  it('shows the first clue only — locked clues never enter the DOM', async () => {
    renderPage();
    expect(await screen.findByText(/1\. İpucu/)).toBeInTheDocument();
    expect(screen.getByText(/Film • 1990’lar/)).toBeInTheDocument();
    // Locked clue LABELS are visible, but their text must not be anywhere.
    expect(screen.queryByText(/Yönetmen: D\. F\./)).toBeNull();
    expect(screen.queryByText(/Brad Pitt/)).toBeNull();
    expect(document.body.textContent).not.toContain('139 dakika');
  });

  it('reveals the next clue on a wrong guess and announces it politely', async () => {
    mockedGuess.mockResolvedValueOnce({ date: '2026-11-01', correct: false });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/1\. İpucu/);

    await user.type(screen.getByLabelText('Tahminin'), 'pulp fiction{enter}');

    expect(await screen.findByText(/Yanlış\. 5 hakkın kaldı — yeni ipucu açıldı\./)).toBeInTheDocument();
    expect(screen.getByText(/Yönetmen: D\. F\./)).toBeInTheDocument(); // clue 2 now open
    expect(screen.getByText(/pulp fiction/)).toBeInTheDocument(); // wrong guess listed
    expect(mockedGuess).toHaveBeenCalledWith({ guess: 'pulp fiction', attempt: 1, final: false });
  });

  it('reveals the answer with post-completion links ONLY after a correct guess', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/1\. İpucu/);
    expect(screen.queryByText('Dövüş Kulübü')).toBeNull(); // never before completion

    mockedGuess.mockResolvedValueOnce({ date: '2026-11-01', correct: true, answer: ANSWER });
    await user.type(screen.getByLabelText('Tahminin'), 'dövüş kulübü{enter}');

    expect(await screen.findByText('Dövüş Kulübü')).toBeInTheDocument();
    expect(await screen.findByText(/Doğru! 1 denemede bildin — 100 puan\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Detay sayfası' })).toHaveAttribute('href', '/movie/550');
    expect(screen.getByRole('link', { name: /Evren’de keşfet/ })).toHaveAttribute(
      'href',
      '/evren?focus=movie:550',
    );
    // Input is gone once the day is done.
    expect(screen.queryByLabelText('Tahminin')).toBeNull();
  });

  it('loses after six wrong guesses and still reveals', async () => {
    const user = userEvent.setup();
    mockedGuess.mockImplementation(async () => ({ date: '2026-11-01', correct: false }));
    renderPage();
    await screen.findByText(/1\. İpucu/);

    for (let i = 0; i < 5; i++) {
      await user.type(screen.getByLabelText('Tahminin'), `yanlis ${i}{enter}`);
      await screen.findByText(/Yanlış\./);
    }
    // 6th and final wrong guess carries the answer with final:true.
    mockedGuess.mockResolvedValueOnce({ date: '2026-11-01', correct: false, answer: ANSWER });
    await user.type(screen.getByLabelText('Tahminin'), 'son deneme{enter}');
    expect(mockedGuess).toHaveBeenLastCalledWith({ guess: 'son deneme', attempt: 6, final: true });
    expect(await screen.findByText('Dövüş Kulübü')).toBeInTheDocument();
    expect(await screen.findByText(/Hakların bitti/)).toBeInTheDocument();
    expect(screen.getAllByText(/çözülemedi/).length).toBeGreaterThan(0);
  });

  it('shares a result card without the answer via the clipboard', async () => {
    const user = userEvent.setup();
    // userEvent.setup() attaches its own clipboard stub — install ours after.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    renderPage();
    await screen.findByText(/1\. İpucu/);

    mockedGuess.mockResolvedValueOnce({ date: '2026-11-01', correct: true, answer: ANSWER });
    await user.type(screen.getByLabelText('Tahminin'), 'fight club{enter}');
    await screen.findByText('Dövüş Kulübü');

    await user.click(screen.getByRole('button', { name: 'Sonucunu paylaş' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const shared = writeText.mock.calls[0][0] as string;
    expect(shared).toContain('1/6');
    expect(shared).not.toContain('Dövüş');
    expect(shared).not.toContain('Fight Club');
  });

  it('restarts cleanly when the UTC day rolls over mid-game', async () => {
    mockedGuess.mockResolvedValueOnce({ date: '2026-11-02', correct: false }); // server moved on
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/1\. İpucu/);

    await user.type(screen.getByLabelText('Tahminin'), 'eski tahmin{enter}');
    await screen.findByText(/Yeni gün başladı/);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    // The new day starts clean and playable.
    expect(screen.getByLabelText('Tahminin')).toBeInTheDocument();
  });
});
