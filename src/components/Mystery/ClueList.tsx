/**
 * The progressively-revealed clue ladder. Locked clues render ONLY their
 * label — their text never enters the DOM until earned, even though the
 * payload carries the whole ladder (the answer itself never ships at all).
 */

import type { MysteryClue } from '../../lib/mystery/types';

interface ClueListProps {
  clues: MysteryClue[];
  /** How many clues are currently open (1 + wrong guesses). */
  revealed: number;
}

export function ClueList({ clues, revealed }: ClueListProps) {
  return (
    <ol className="space-y-3" aria-label="İpucu merdiveni">
      {clues.map((clue, i) => {
        const open = i < revealed;
        const li = open ? (
          <li
            key={clue.id}
            className="rounded-lg border border-line-strong/60 bg-surface-raised/60 p-4"
            aria-current={i === revealed - 1 ? 'true' : undefined}
          >
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
              {i + 1}. İpucu — {clue.label}
            </p>
            <p className="mt-1.5 text-primary">{clue.text}</p>
          </li>
        ) : (
          <li
            key={clue.id}
            className="rounded-lg border border-dashed border-line-strong/40 p-4"
            aria-label={`${i + 1}. ipucu kilitli`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              {i + 1}. İpucu — {clue.label}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              {i}. yanlış tahminde açılır
              <span aria-hidden="true"> 🔒</span>
            </p>
          </li>
        );
        return li;
      })}
    </ol>
  );
}
