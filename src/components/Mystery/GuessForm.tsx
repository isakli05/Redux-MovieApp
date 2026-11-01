/**
 * Guess input: a plain labeled form (Enter submits — the whole game is
 * keyboard-operable) with the remaining-attempt pips.
 */

import { useId, useState } from 'react';
import { Button } from '../ui';

interface GuessFormProps {
  attemptsLeft: number;
  maxAttempts: number;
  loading?: boolean;
  onSubmit: (guess: string) => void;
  wrongGuesses: readonly string[];
}

export function GuessForm({ attemptsLeft, maxAttempts, loading = false, onSubmit, wrongGuesses }: GuessFormProps) {
  const [value, setValue] = useState('');
  const inputId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = value.trim();
    if (!guess || loading) return;
    onSubmit(guess);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-secondary">
          Tahminin
        </label>
        <p className="text-xs text-muted" aria-label={`Kalan deneme hakkı: ${attemptsLeft}`}>
          Kalan hak:{' '}
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: maxAttempts }, (_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i < attemptsLeft ? 'bg-accent' : 'bg-line-strong'}`}
              />
            ))}
          </span>
          <span className="sr-only">{attemptsLeft}</span>
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          maxLength={100}
          disabled={loading}
          placeholder="Örn. Uzay Yolcusu"
          className="h-11 w-full min-w-0 flex-grow rounded-md border border-line-strong bg-surface-raised px-3 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <Button type="submit" loading={loading} disabled={!value.trim() || attemptsLeft <= 0}>
          Dene
        </Button>
      </div>
      {wrongGuesses.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          <span className="sr-only">Yanlış tahminler: </span>
          <span aria-hidden="true">Denemeler: </span>
          {wrongGuesses.join(', ')}
        </p>
      )}
    </form>
  );
}
