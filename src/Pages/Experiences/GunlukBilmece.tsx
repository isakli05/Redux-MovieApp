/**
 * F5 — Günlük Bilmece: one deterministic film/TV identification challenge per
 * UTC day (server-picked, same for everyone), 6 attempts, a clue ladder that
 * opens on wrong guesses, local streak + played-days calendar, and a share
 * card that never contains the answer. The answer appears only after the
 * challenge completes (SHARED_CONTRACTS §E/§H).
 */

import { useCallback, useEffect, useState } from 'react';
import { ClueList } from '../../components/Mystery/ClueList';
import { GuessForm } from '../../components/Mystery/GuessForm';
import { PlayedCalendar } from '../../components/Mystery/PlayedCalendar';
import { ResultCard } from '../../components/Mystery/ResultCard';
import { Button, ErrorState, SectionHeader, Skeleton } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { fetchDailyMystery, submitGuess } from '../../lib/mystery/api';
import { pointsForWin, revealedClueCount } from '../../lib/mystery/scoring';
import {
  currentStreak,
  loadDays,
  loadSession,
  recordDay,
  saveSession,
  type MysteryDayRecord,
  type MysterySession,
} from '../../lib/mystery/state';
import type { MysteryDayPayload } from '../../lib/mystery/types';

function formatDateLabel(dateKey: string): string {
  const t = Date.parse(`${dateKey}T00:00:00Z`);
  return Number.isNaN(t)
    ? dateKey
    : new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(t);
}

export default function GunlukBilmece() {
  const { user } = useAuth();
  const [day, setDay] = useState<MysteryDayPayload | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [session, setSession] = useState<MysterySession | null>(null);
  const [days, setDays] = useState<Record<string, MysteryDayRecord>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadDay = useCallback(async () => {
    setLoadFailed(false);
    setFeedback('');
    try {
      const payload = await fetchDailyMystery();
      setDay(payload);
      // A stored session only counts for the server's current day; a fresh
      // (or rolled-over) day starts a clean playing session.
      setSession(loadSession(payload.date) ?? { date: payload.date, guesses: [], status: 'playing' });
      setDays(loadDays());
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void loadDay();
  }, [loadDay]);

  const status = session?.status ?? 'playing';
  const attemptsUsed = session?.guesses.length ?? 0;
  const revealed = revealedClueCount(attemptsUsed, day?.clues.length ?? 1);
  const attemptsAllowed = day?.attemptsAllowed ?? 6;
  const attemptsLeft = Math.max(attemptsAllowed - attemptsUsed, 0);
  const streak = day ? currentStreak(days, day.date) : 0;
  const record = day ? days[day.date] : undefined;

  const handleGuess = useCallback(
    async (guess: string) => {
      if (!day || !session || session.status !== 'playing' || submitting) return;
      const attempt = session.guesses.length + 1;
      const final = attempt >= day.attemptsAllowed;
      setSubmitting(true);
      try {
        const res = await submitGuess({ guess, attempt, final });
        if (res.date !== day.date) {
          // The UTC day rolled over between load and guess — reload the new day.
          await loadDay();
          setFeedback('Yeni gün başladı — bugünün bilmecesi yüklendi.');
          return;
        }
        if (res.correct && res.answer) {
          const points = pointsForWin(attempt);
          const next: MysterySession = {
            date: day.date,
            guesses: [...session.guesses, guess],
            status: 'won',
            answer: res.answer,
          };
          setSession(next);
          saveSession(next);
          setDays(
            recordDay({ date: day.date, won: true, attempts: attempt, points, answer: res.answer }),
          );
          setFeedback(`Doğru! ${attempt} denemede bildin — ${points} puan.`);
          return;
        }
        if (final && res.answer) {
          const next: MysterySession = {
            ...session,
            guesses: [...session.guesses, guess],
            status: 'lost',
            answer: res.answer,
          };
          setSession(next);
          saveSession(next);
          setDays(
            recordDay({ date: day.date, won: false, attempts: attempt, points: 0, answer: res.answer }),
          );
          setFeedback('Hakların bitti — cevap aşağıda.');
          return;
        }
        const next: MysterySession = { ...session, guesses: [...session.guesses, guess] };
        setSession(next);
        saveSession(next);
        const openedNewClue =
          revealedClueCount(attempt, day.clues.length) > revealedClueCount(attempt - 1, day.clues.length);
        setFeedback(
          `Yanlış. ${day.attemptsAllowed - attempt} hakkın kaldı${openedNewClue ? ' — yeni ipucu açıldı.' : '.'}`,
        );
      } catch (e) {
        setFeedback(
          e instanceof Error && e.message === 'rate_limited'
            ? 'Bugünlük tahmin sınırına ulaşıldı. Yarın yeni bilmece!'
            : 'Tahmin gönderilemedi — tekrar dene.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [day, session, submitting, loadDay],
  );

  if (loadFailed) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <SectionHeader as="h1" eyebrow="LMDB Deneyimleri" title="Günlük Bilmece" />
        <div className="mt-10">
          <ErrorState
            title="Bilmece yüklenemedi"
            message="Günün bilmecesi şu anda alınamıyor. Lütfen tekrar deneyin."
            onRetry={() => void loadDay()}
            retryLabel="Tekrar Dene"
            backTo="/"
            backLabel="Ana Sayfaya Dön"
          />
        </div>
      </section>
    );
  }

  if (!day || !session) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6" aria-busy="true">
        <SectionHeader as="h1" eyebrow="LMDB Deneyimleri" title="Günlük Bilmece" />
        <div className="mt-10 space-y-4">
          <Skeleton variant="line" />
          <Skeleton variant="line" className="w-3/4" />
          <Skeleton variant="line" className="w-1/2" />
        </div>
        <span className="sr-only">Günün bilmecesi yükleniyor…</span>
      </section>
    );
  }

  const reveal = session.answer;

  return (
    <section className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:py-14">
      <SectionHeader as="h1" eyebrow="LMDB Deneyimleri" title="Günlük Bilmece" />
      <p className="mt-3 text-secondary">
        Her gün tek bir film veya dizi bilmecesi — herkes için aynı. İlk ipucudan başla, altı hakkın var.
      </p>
      <p className="mt-1 text-xs text-muted">
        {formatDateLabel(day.date)} • Bilmeceler her gün 00:00 UTC’de yenilenir (Türkiye saatiyle 03:00).
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-surface-raised px-3 py-1 text-secondary">
          Seri: <strong className="text-primary">{streak}</strong> gün
        </span>
        <span className="rounded-full bg-surface-raised px-3 py-1 text-secondary">
          Bugüne dek <strong className="text-primary">{Object.keys(days).length}</strong> bilmece
        </span>
        {record && (
          <span className="rounded-full bg-surface-raised px-3 py-1 text-secondary">
            Bugün: <strong className="text-primary">{record.won ? `${record.points} puan` : 'çözülemedi'}</strong>
          </span>
        )}
      </div>

      <div className="glass-bar mt-6 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-primary">İpuçları</h2>
        <p className="mt-1 text-sm text-muted">Her yanlış tahmin bir sonraki ipucunu açar.</p>
        <div className="mt-4">
          <ClueList clues={day.clues} revealed={revealed} />
        </div>

        {status === 'playing' ? (
          <GuessForm
            attemptsLeft={attemptsLeft}
            maxAttempts={day.attemptsAllowed}
            loading={submitting}
            onSubmit={(g) => void handleGuess(g)}
            wrongGuesses={session.guesses}
          />
        ) : (
          <p className="mt-6 rounded-lg bg-surface-raised/60 p-4 text-sm text-secondary">
            {status === 'won'
              ? `Bugünü çözdün — ${record?.points ?? 0} puan. Yarın yeni bilmece!`
              : 'Bugünkü bilmece tamamlandı. Yarın yeniden dene!'}
          </p>
        )}
        <p aria-live="polite" className="mt-4 min-h-[1.5rem] text-sm text-accent">
          {feedback}
        </p>
      </div>

      {reveal && (
        <ResultCard
          answer={reveal}
          won={session.status === 'won'}
          attempts={attemptsUsed}
          maxAttempts={day.attemptsAllowed}
          points={record?.points ?? 0}
          streak={streak}
          date={day.date}
          accountId={user?.id ?? null}
        />
      )}

      <PlayedCalendar date={day.date} days={days} />

      <p className="mt-8 text-center">
        <Button to="/evren" variant="ghost" size="sm">
          Cinema Universe’i keşfet
        </Button>
      </p>
    </section>
  );
}
