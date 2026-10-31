/**
 * PaginationNav — numaralı sayfalama (defect K fix, spec §6 Search).
 * Prev/next + pencerenmiş sayfa numaraları + ellipsis; URL senkronizasyonu ve
 * yukarı kaydırma üst bileşene aittir (onPageChange ile).
 */

import type { ReactNode } from 'react';

export interface PaginationNavProps {
  /** 1 tabanlı aktif sayfa. */
  page: number;
  /** API `total_pages` değeri (500'e clamp edilmiş). */
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Pencereyi hesaplayan saf yardımcı (test edilir): [1, '…', 4, 5, 6, '…', 42]. */
export function pageWindow(current: number, total: number, span = 1): (number | '…')[] {
  if (total <= 0) return [];
  const clamped = Math.min(Math.max(current, 1), total);

  const pages = new Set<number>([1, total]);
  for (let p = clamped - span; p <= clamped + span; p += 1) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const windowed: (number | '…')[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) windowed.push('…');
    windowed.push(p);
  });
  return windowed;
}

const CHEVRON_CLASS = 'h-4 w-4';

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line px-2 text-sm font-medium text-secondary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function PaginationNav({ page, totalPages, onPageChange, className = '' }: PaginationNavProps) {
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(page, 1), totalPages);

  return (
    <nav
      aria-label="Sayfalama"
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
    >
      <ControlButton
        label="Önceki sayfa"
        onClick={() => onPageChange(current - 1)}
        disabled={current <= 1}
      >
        <svg className={CHEVRON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </ControlButton>

      {pageWindow(current, totalPages).map((entry, index) =>
        entry === '…' ? (
          <span key={`gap-${index}`} className="px-1.5 text-sm text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            aria-current={entry === current ? 'page' : undefined}
            onClick={() => onPageChange(entry)}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium tabular-nums transition-colors duration-150 ease-cine ${
              entry === current
                ? 'border-accent bg-surface-overlay text-accent'
                : 'border-line text-secondary hover:border-accent hover:text-accent'
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <ControlButton
        label="Sonraki sayfa"
        onClick={() => onPageChange(current + 1)}
        disabled={current >= totalPages}
      >
        <svg className={CHEVRON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </ControlButton>
    </nav>
  );
}
