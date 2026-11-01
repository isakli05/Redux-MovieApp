/**
 * Win/loss reveal card — the ONLY surface where the answer appears, and only
 * after completion. Links the title to its detail page and the Cinema
 * Universe focus view (SHARED_CONTRACTS §H), offers a no-answer share text and
 * an optional "watched" signal into the shared interaction log.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { logInteraction } from '../../lib/interactions';
import { buildShareText } from '../../lib/mystery/state';
import type { MysteryAnswer } from '../../lib/mystery/types';
import { getImageUrl, posterSrcset } from '../../utils/image.utils';
import { Button } from '../ui';

interface ResultCardProps {
  answer: MysteryAnswer;
  won: boolean;
  attempts: number;
  maxAttempts: number;
  points: number;
  streak: number;
  date: string;
  /** TMDB account id for scoping the optional interaction-log event. */
  accountId?: number | null;
}

export function ResultCard({
  answer,
  won,
  attempts,
  maxAttempts,
  points,
  streak,
  date,
  accountId,
}: ResultCardProps) {
  const [shareNote, setShareNote] = useState('');
  const [marked, setMarked] = useState(false);

  const share = async () => {
    const text = buildShareText({ date, won, attempts, maxAttempts, streak });
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote('Sonuç panoya kopyalandı.');
    } catch {
      // User dismissed the share sheet, or clipboard denied — no drama.
      setShareNote(typeof navigator.share === 'function' ? '' : 'Kopyalanemedi — tarayıcı izni gerekli.');
    }
  };

  const markWatched = () => {
    if (marked) return;
    logInteraction(
      { kind: 'seen', target: { kind: answer.mediaType, id: answer.id, title: answer.title }, source: 'mystery' },
      accountId,
    );
    setMarked(true);
  };

  const detailPath = `/${answer.mediaType}/${answer.id}`;

  return (
    <section
      aria-labelledby="mystery-reveal-title"
      className="motion-safe:animate-fade-in mt-6 rounded-2xl border border-line-strong/60 bg-surface-overlay p-5 sm:p-6"
    >
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
        {won ? `Buldun! ${attempts}/${maxAttempts} deneme • ${points} puan` : `Bulamadın — ${maxAttempts} deneme`}
      </p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row">
        {answer.posterPath && (
          <img
            src={getImageUrl(answer.posterPath, 'w185')}
            srcSet={posterSrcset(answer.posterPath)}
            sizes="(min-width: 640px) 185px, 128px"
            alt=""
            loading="lazy"
            className="h-auto w-32 shrink-0 self-start rounded-lg border border-line-strong/40 sm:w-40"
          />
        )}
        <div className="min-w-0">
          <h2 id="mystery-reveal-title" className="font-display text-2xl font-semibold tracking-tight text-primary">
            {answer.title}
          </h2>
          <p className="mt-1 text-sm text-secondary">
            {[answer.year, answer.creditsLine].filter(Boolean).join(' • ')}
          </p>
          {answer.overview && <p className="mt-3 text-sm leading-relaxed text-secondary">{answer.overview}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button to={detailPath} size="sm">
              Detay sayfası
            </Button>
            <Button to={`/evren?focus=${answer.mediaType}:${answer.id}`} variant="outline" size="sm">
              Evren’de keşfet
            </Button>
            <Button variant="ghost" size="sm" onClick={markWatched} disabled={marked}>
              {marked ? 'İzledim olarak işaretlendi' : 'İzledim olarak işaretle'}
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line-strong/40 pt-4">
        <Button variant="outline" size="sm" onClick={() => void share()}>
          Sonucunu paylaş
        </Button>
        <Link to={detailPath} className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
          Cevabın sayfasına git
        </Link>
        <p aria-live="polite" className="text-sm text-secondary">
          {shareNote}
        </p>
      </div>
    </section>
  );
}
