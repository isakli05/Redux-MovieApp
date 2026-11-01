import type { ReactNode } from 'react'

/**
 * Adım seçenek kartları — yerleşik radio/checkbox girdileri (klavye ve ekran
 * okuyucu ücretsiz), kart görselliği peer durumlarıyla sürülür. WCAG 2.2 AA:
 * odak halkası accent + offset, hedef alanı ≥44px, dokunmatik dostu.
 */

const FOCUS_RING =
  'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-void'

const CARD_BASE =
  'block h-full min-h-[3rem] cursor-pointer rounded-lg border bg-surface-raised p-4 text-left motion-safe:transition-colors motion-safe:duration-150 ease-cine hover:border-accent'

interface OptionCardShellProps {
  checked: boolean;
  children: ReactNode;
}

function OptionCardShell({ checked, children }: OptionCardShellProps) {
  return (
    <div
      className={`${CARD_BASE} ${FOCUS_RING} ${
        checked ? 'border-accent bg-surface-overlay shadow-cine' : 'border-line-strong'
      }`}
    >
      {children}
    </div>
  );
}

export interface RadioOption {
  value: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

interface RadioCardsProps {
  /** Aynı name = yerleşik radio grubu. */
  name: string;
  /** Grubun erişilebilir adı (ekran okuyucu duyurur). */
  legend: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 'two' | 'four';
}

export function RadioCards({ name, legend, options, value, onChange, columns = 'two' }: RadioCardsProps) {
  const grid =
    columns === 'four' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4' : 'grid gap-3 sm:grid-cols-2'
  return (
    <div className={grid} role="radiogroup" aria-label={legend}>
      {options.map((option) => (
        <label key={option.value} className="relative block">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <OptionCardShell checked={value === option.value}>
            <span className="flex items-start gap-3">
              {option.icon && (
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
                  {option.icon}
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-display text-base font-semibold text-primary">
                  {option.label}
                </span>
                {option.hint && (
                  <span className="mt-1 block text-sm leading-relaxed text-secondary">
                    {option.hint}
                  </span>
                )}
              </span>
            </span>
          </OptionCardShell>
        </label>
      ))}
    </div>
  );
}

export interface CheckOption {
  value: number;
  label: string;
}

interface CheckChipsProps {
  legend: string;
  options: CheckOption[];
  values: number[];
  onToggle: (value: number) => void;
}

/** Çoklu seçim (türler, servisler) — yerleşik checkbox'lı çipler. */
export function CheckChips({ legend, options, values, onToggle }: CheckChipsProps) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const checked = values.includes(option.value);
        return (
          <label key={option.value} className="relative block">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option.value)}
              className="peer sr-only"
            />
            <span
              className={`inline-flex min-h-[2.75rem] cursor-pointer items-center rounded-full border px-4 text-sm font-medium motion-safe:transition-colors motion-safe:duration-150 ease-cine peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-void ${
                checked
                  ? 'border-accent bg-surface-overlay text-accent'
                  : 'border-line-strong bg-surface-overlay text-secondary hover:border-accent hover:text-primary'
              }`}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
