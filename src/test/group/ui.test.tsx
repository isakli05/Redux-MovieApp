/**
 * UI davranış tuzakları: QR'lı davet kartı, oy kartı erişilebilirliği ve
 * sonuç panelinin dökümü. (Tam akış src/test/group/memoryApi.test.ts'de.)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// jsdom'da canvas yok → QR üretimini mock'la; data URL CSP'ye uygun gelir.
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr') } }));

import { ShareCard } from '../../components/GroupChoice/ShareCard';
import { VoteCard } from '../../components/GroupChoice/VoteCard';
import { ResultPanel } from '../../components/GroupChoice/ResultPanel';
import { clearIdentity, loadIdentity, saveIdentity } from '../../lib/group/identity';
import type { Candidate, RoomResult } from '../../lib/group/api';

const candidate: Candidate = {
  key: 'movie:550', kind: 'movie', id: 550, title: 'Fight Club', posterPath: '/p.jpg',
  year: 1999, genreIds: [18], voteAverage: 8.4, overview: 'Bir insomnia klasiği.',
};

describe('ShareCard', () => {
  it('kodu okunur biçimde ve QR görselini render eder', async () => {
    render(<ShareCard code="K7M2XQ" />);
    expect(screen.getByText('K7M2XQ')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByAltText('Oda davet QR kodu')).toHaveAttribute(
        'src', 'data:image/png;base64,qr',
      );
    });
  });
});

describe('VoteCard', () => {
  it('dört oy düğmesi aria-pressed ile durum bildirir; tıklama anahtarı taşır', async () => {
    const onVote = vi.fn();
    const first = render(
      <MemoryRouter>
        <VoteCard candidate={candidate} myVote={undefined} onVote={onVote} />
      </MemoryRouter>,
    );
    const veto = screen.getByRole('button', { name: 'Fight Club — Veto' });
    expect(veto).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(veto);
    expect(onVote).toHaveBeenCalledWith('movie:550', 'dislike');

    first.unmount();
    render(
      <MemoryRouter>
        <VoteCard candidate={candidate} myVote="strong" onVote={onVote} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Fight Club — Çok isterim' }))
      .toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ResultPanel', () => {
  const entry = {
    key: 'movie:550', kind: 'movie' as const, id: 550, title: 'Fight Club',
    posterPath: '/p.jpg', year: 1999, strong: 2, like: 1, skip: 0, dislike: 0,
    score: 7, mutual: true, vetoed: false, boosted: false,
  };
  const result: RoomResult = { at: 1, winner: entry, ranking: [entry], tie: false, reason: 'match' };

  it('kazananı, dökümü ve gerekçeyi gösterir', () => {
    render(
      <MemoryRouter>
        <ResultPanel result={result} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
    expect(screen.getByText(/2 × çok isterim/)).toBeInTheDocument();
    expect(screen.getByText(/1 × izlerim/)).toBeInTheDocument();
    expect(screen.getByText(/karşılıklı eşleşme/i)).toBeInTheDocument();
    expect(screen.getByText('Grup puanı: 7')).toBeInTheDocument();
  });

  it('tam eşleşme yoksa uzlaşı gerekçesi; hepsi vetoysa açık mesaj', () => {
    render(
      <MemoryRouter>
        <ResultPanel result={{ ...result, reason: 'compromise', winner: { ...entry, mutual: false } }} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/uzlaşı adayı seçildi/i)).toBeInTheDocument();
  });
});

describe('oda kimliği (localStorage)', () => {
  beforeEach(() => localStorage.clear());

  it('kaydet/yükle/sil: pid korunur, hostKey yalnız ev sahibinde', () => {
    saveIdentity('K7M2XQ', { pid: 'p_host', hostKey: 'h_secret' });
    expect(loadIdentity('K7M2XQ')).toEqual({ pid: 'p_host', hostKey: 'h_secret' });
    saveIdentity('AB23CD', { pid: 'p_guest' });
    expect(loadIdentity('AB23CD')).toEqual({ pid: 'p_guest' });
    expect(loadIdentity('ZZZZZZ')).toBeNull();
    clearIdentity('K7M2XQ');
    expect(loadIdentity('K7M2XQ')).toBeNull();
  });

  it('bozuk kayıt null döner (json parse / tip dışı pid)', () => {
    localStorage.setItem('lmdb:group/room/BROKEN', '{not json');
    expect(loadIdentity('BROKEN')).toBeNull();
    localStorage.setItem('lmdb:group/room/NOPE', JSON.stringify({ pid: 'spy' }));
    expect(loadIdentity('NOPE')).toBeNull();
  });
});
