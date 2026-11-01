/**
 * Played-days calendar for one UTC month: gold dot = solved, hollow dot =
 * played and lost, today outlined. Purely informational (no day navigation —
 * old puzzles are not replayable), so it is exposed to screen readers as a
 * single labelled image with a textual summary.
 */

import type { MysteryDayRecord } from '../../lib/mystery/state';

interface PlayedCalendarProps {
  /** Puzzle-day key (`YYYY-MM-DD`) whose month is shown. */
  date: string;
  days: Record<string, MysteryDayRecord>;
}

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** Day cells for the month of `date`, padded to Monday-first weeks. */
export function monthCells(date: string): (string | null)[] {
  const [y, m] = date.split('-').map(Number);
  if (!y || !m) return [];
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday = 0
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function PlayedCalendar({ date, days }: PlayedCalendarProps) {
  const [y, m] = date.split('-').map(Number);
  const monthLabel = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)));

  const played = Object.values(days).filter((d) => d.date.startsWith(`${y}-${String(m).padStart(2, '0')}`));
  const won = played.filter((d) => d.won).length;

  return (
    <section className="mt-10" aria-labelledby="mystery-calendar-title">
      <h2 id="mystery-calendar-title" className="font-display text-lg font-semibold text-primary">
        {monthLabel} takvimi
      </h2>
      <p className="mt-1 text-sm text-muted" aria-hidden="false">
        Bu ay {played.length} gün oynadın, {won} bilmece çözüldü.
      </p>
      <div
        role="img"
        aria-label={`${monthLabel}: ${played.length} gün oynandı, ${won} bilmece çözüldü.`}
        className="mt-3 grid grid-cols-7 gap-1 text-center"
      >
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 text-[11px] uppercase tracking-wide text-muted" aria-hidden="true">
            {d}
          </span>
        ))}
        {monthCells(date).map((cell, i) => {
          if (!cell) return <span key={`pad-${i}`} aria-hidden="true" />;
          const record = days[cell];
          const isToday = cell === date;
          return (
            <span
              key={cell}
              className={`flex h-9 items-center justify-center rounded-md text-xs
                ${isToday ? 'border border-accent/70 text-primary' : 'text-muted'}
                ${record ? (record.won ? 'bg-accent/20 text-primary' : 'bg-surface-raised') : ''}`}
            >
              <span aria-hidden="true">{Number(cell.slice(8))}</span>
              {record?.won && <span className="sr-only"> — çözüldü</span>}
              {record && !record.won && <span className="sr-only"> — oynandı, çözülemedi</span>}
            </span>
          );
        })}
      </div>
    </section>
  );
}
