/**
 * RoomStage — canlı oda görünümü (poll ≤4 s). Fazlara göre:
 *   gathering: davet + kısıtlar (ev sahibi) + aday üretimi + katılımcılar
 *   voting   : ortak aday destesi, gizli oylar, ilerleme
 *   reveal   : sunucunun hesapladığı sonuç — herkeste aynı anda görünür
 *
 * Oylar etkileşim günlüğüne de yazılır (SHARED_CONTRACTS §B, source: 'group').
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { logInteraction } from '../../lib/interactions';
import type { GroupApi, RoomConstraints, VoteValue } from '../../lib/group/api';
import { useRoom } from '../../lib/group/useRoom';
import { loadAnonymousTaste } from '../../lib/group/dna';
import { ShareCard } from './ShareCard';
import { ConstraintsForm, REGION_LABELS } from './ConstraintsForm';
import { VoteCard } from './VoteCard';
import { ResultPanel } from './ResultPanel';
import { genresFor } from '../Discover/genres';

interface RoomStageProps {
  api: GroupApi;
  code: string;
  pid: string;
  hostKey?: string;
  /** Kimlik geçersizdi (not_in_room) — yeniden katılım akışına dön. */
  onRejoin: () => void;
  /** Landing'e dön (yerel kimlik korunur). */
  onExit: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  gathering: 'Toplanıyor',
  voting: 'Oylama',
  reveal: 'Sonuç',
};

function constraintsSummary(c: RoomConstraints): string {
  const bits: string[] = [c.mediaType === 'movie' ? 'Film' : 'Dizi'];
  if (c.maxRuntime !== null) bits.push(`≤ ${c.maxRuntime} dk`);
  if (c.genres.length > 0) {
    const names = genresFor(c.mediaType).filter((g) => c.genres.includes(g.id)).map((g) => g.name);
    if (names.length > 0) bits.push(names.join(', '));
  }
  bits.push(REGION_LABELS[c.region] ?? c.region);
  return bits.join(' · ');
}

export function RoomStage({ api, code, pid, hostKey, onRejoin, onExit }: RoomStageProps) {
  const { view, status, error, busy, act } = useRoom(api, code, pid);
  const { user } = useAuth();
  const [dnaBusy, setDnaBusy] = useState(false);

  if (status === 'connecting' || !view) {
    return (
      <div className="py-24 text-center text-secondary" role="status">
        Oda yükleniyor…
      </div>
    );
  }

  if (status === 'gone') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-display text-xl text-primary">Oda bulunamadı ya da süresi geçti.</p>
        <p className="mt-2 text-sm text-secondary">Odalar 24 saat sonra kendiliğinden kapanır.</p>
        <Button className="mt-6" onClick={onExit}>
          Yeni Oda Kur
        </Button>
      </div>
    );
  }

  if (status === 'not_in_room') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-display text-xl text-primary">Bu odadaki katılımcı kaydın silinmiş.</p>
        <p className="mt-2 text-sm text-secondary">Yeniden katılıp kalından devam edebilirsin.</p>
        <Button className="mt-6" onClick={onRejoin}>
          Yeniden Katıl
        </Button>
      </div>
    );
  }

  const isHost = view.me.isHost && hostKey !== undefined;
  const myVoteCount = Object.keys(view.me.myVotes).length;
  const votedParticipants = view.participants.filter((p) => p.votedCount > 0).length;
  const hoursLeft = Math.max(0, view.expiresAt - view.serverNow) / 3_600_000;
  const expiryText = hoursLeft >= 1
    ? `Oda ~${Math.floor(hoursLeft)} saat sonra kapanır`
    : `Oda ~${Math.max(1, Math.floor(hoursLeft * 60))} dakika sonra kapanır`;

  const handleVote = async (key: string, value: VoteValue) => {
    const ok = await act((a) => a.vote(code, pid, key, value));
    if (!ok) return;
    const cand = view.candidates.find((c) => c.key === key);
    if (cand && (value === 'strong' || value === 'like' || value === 'dislike')) {
      logInteraction(
        {
          kind: value === 'dislike' ? 'dislike' : 'like',
          target: { kind: cand.kind, id: cand.id, title: cand.title, posterPath: cand.posterPath },
          source: 'group',
        },
        user?.id,
      );
    }
  };

  const attachDna = async () => {
    setDnaBusy(true);
    try {
      const taste = await loadAnonymousTaste(user?.id);
      if (taste && taste.genres.length > 0) {
        await act((a) => a.attachTaste(code, pid, taste.genres));
      }
    } finally {
      setDnaBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Oda {view.code} · {PHASE_LABELS[view.phase]}
          </p>
          <h1 className="mt-1 font-display text-3xl text-primary">Birlikte İzle</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{expiryText}</span>
          <Link
            to="/birlikte"
            onClick={onExit}
            className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Çık
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-danger bg-surface-raised p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {view.phase === 'gathering' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <ShareCard code={view.code} />
            <div className="rounded-lg border border-line bg-surface-raised p-5">
              <h3 className="font-display text-lg text-primary">Katılımcılar ({view.participants.length})</h3>
              <ul className="mt-3 space-y-1.5">
                {view.participants.map((p) => (
                  <li key={p.pid} className="flex items-center justify-between text-sm">
                    <span className="truncate text-primary">
                      {p.name}
                      {p.isHost && <span className="ml-2 text-xs text-accent">ev sahibi</span>}
                    </span>
                    {p.tasteAttached && <span className="text-xs text-muted">DNA</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-line pt-4">
                {view.me.tasteGenres.length > 0 ? (
                  <p className="text-xs text-secondary">
                    Anonim DNA özeti bağlı ({view.me.tasteGenres.length} tür) — oyların iki kat sayılıyor.
                  </p>
                ) : (
                  <Button size="sm" variant="outline" loading={dnaBusy} onClick={attachDna}>
                    Sinema DNA'mı Bağla (anonim)
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isHost ? (
              <div className="rounded-lg border border-line bg-surface-raised p-5">
                <h3 className="font-display text-lg text-primary">Kısıtlar</h3>
                <p className="mt-1 text-xs text-muted">
                  Adaylar bu kısıtlarla sunucuda TMDB'den seçilir.
                </p>
                <div className="mt-4">
                  <ConstraintsForm
                    api={api}
                    value={view.constraints}
                    busy={busy}
                    onSave={(c) => void act((a) => a.setConstraints(code, hostKey, pid, c))}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-5">
                  <Button
                    variant="outline"
                    loading={busy}
                    onClick={() => void act((a) => a.generateCandidates(code, hostKey, pid))}
                  >
                    Adayları Üret
                  </Button>
                  <Button
                    disabled={view.candidates.length < 2}
                    onClick={() => void act((a) => a.setPhase(code, hostKey, pid, 'voting'))}
                  >
                    Oylamayı Başlat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-surface-raised p-5">
                <h3 className="font-display text-lg text-primary">Oda Kısıtları</h3>
                <p className="mt-2 text-sm text-secondary">{constraintsSummary(view.constraints)}</p>
                <p className="mt-4 text-sm text-muted">
                  Ev sahibi oylamayı başlatana kadar burada bekle; sayfa kendini günceller.
                </p>
              </div>
            )}

            {view.candidates.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-secondary">
                  Adaylar ({view.candidates.length})
                </h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {view.candidates.map((c) => (
                    <li
                      key={c.key}
                      className="overflow-hidden rounded-md border border-line bg-surface-raised"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w185${c.posterPath ?? ''}`}
                        alt=""
                        loading="lazy"
                        className="aspect-[2/3] w-full object-cover"
                      />
                      <p className="truncate px-2 py-1.5 text-xs text-primary" title={c.title}>
                        {c.title}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {view.phase === 'voting' && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-secondary" role="status">
              Sen {myVoteCount}/{view.candidates.length} aday oyladın · {votedParticipants}/{view.participants.length} kişi oyladı
            </p>
            {isHost && (
              <Button onClick={() => void act((a) => a.setPhase(code, hostKey, pid, 'reveal'))}>
                Sonuçları Açıkla
              </Button>
            )}
          </div>
          {view.me.tasteGenres.length === 0 && (
            <div className="mt-3">
              <Button size="sm" variant="ghost" loading={dnaBusy} onClick={attachDna}>
                Sinema DNA'mı Bağla (anonim) — oylarımı ağırlaştırır
              </Button>
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {view.candidates.map((c) => (
              <VoteCard
                key={c.key}
                candidate={c}
                myVote={view.me.myVotes[c.key]}
                onVote={(k, v) => void handleVote(k, v)}
                disabled={busy}
              />
            ))}
          </div>
        </div>
      )}

      {view.phase === 'reveal' && (
        <div className="mt-8">
          {view.result ? (
            <ResultPanel result={view.result} />
          ) : (
            <p className="py-16 text-center text-secondary" role="status">
              Sonuç hesaplanıyor…
            </p>
          )}
          <p className="mt-8 text-center text-xs text-muted">
            Sıralamayı oda kapanana kadar ({expiryText.toLowerCase()}) inceleyebilirsin.
          </p>
        </div>
      )}
    </section>
  );
}
