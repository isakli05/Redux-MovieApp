/**
 * Keşfet filtre paneli + aktif filtre çipleri (spec §6 Discover).
 * Tüm durum URL'de yaşar; panel yalnızca `onChange(next)` yayar.
 */

import type { ChangeEvent, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Chip } from '@components/ui';
import type { DiscoverFilterState, DiscoverLanguage, DiscoverSortId } from './discoverFilters';
import { DISCOVER_MAX_YEAR, DISCOVER_MIN_YEAR, activeFilterChips } from './discoverFilters';
import { genresFor } from './genres';

export interface FilterPanelProps {
  state: DiscoverFilterState;
  onChange: (next: DiscoverFilterState) => void;
}

const SELECT_CLASS =
  'h-9 rounded-md border border-line bg-surface-overlay px-2.5 text-sm text-primary transition-colors duration-150 ease-cine hover:border-line-strong focus:border-accent focus:outline-none';

const YEARS: number[] = Array.from(
  { length: DISCOVER_MAX_YEAR - DISCOVER_MIN_YEAR + 1 },
  (_, index) => DISCOVER_MAX_YEAR - index,
);

const RATINGS = [5, 6, 7, 8] as const;

const SORT_LABELS: Record<DiscoverSortId, string> = {
  popularity: 'Popülerlik',
  rating: 'Puan (en yüksek)',
  votes: 'Oy sayısı',
  date_desc: 'En yeni',
  date_asc: 'En eski',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">{label}</span>
      {children}
    </label>
  );
}

export function FilterPanel({ state, onChange }: FilterPanelProps) {
  const patch = (partial: Partial<DiscoverFilterState>) => onChange({ ...state, ...partial });

  // Tür değişimi: movie/tv tür ID uzayları farklı → seçimler sıfırlanır.
  const changeType = (type: DiscoverFilterState['type']) => {
    if (type === state.type) return;
    onChange({ ...state, type, genres: [] });
  };

  const toggleGenre = (id: number) => {
    patch({
      genres: state.genres.includes(id)
        ? state.genres.filter((g) => g !== id)
        : [...state.genres, id],
    });
  };

  const yearValue = (value: number | null): string => (value === null ? '' : String(value));
  const parseYearSelect = (event: ChangeEvent<HTMLSelectElement>): number | null => {
    const raw = event.target.value;
    if (!raw) return null;
    const year = Number(raw);
    return Number.isInteger(year) ? year : null;
  };

  return (
    <div className="space-y-5 rounded-xl border border-line bg-surface-base p-4 sm:p-5">
      {/* Tür (Film/Dizi) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium uppercase tracking-[0.08em] text-secondary">Tür</span>
        <Chip active={state.type === 'movie'} onClick={() => changeType('movie')}>
          Film
        </Chip>
        <Chip active={state.type === 'tv'} onClick={() => changeType('tv')}>
          Dizi
        </Chip>
      </div>

      {/* Türler (genre) — çoklu seçim */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-secondary">
          Türler
        </p>
        <div className="flex flex-wrap gap-1.5">
          {genresFor(state.type).map((genre) => (
            <Chip
              key={genre.id}
              active={state.genres.includes(genre.id)}
              onClick={() => toggleGenre(genre.id)}
            >
              {genre.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* Seçmeler: yıl aralığı, puan, dil, sıralama */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Field label="Başlangıç yılı">
          <select
            className={SELECT_CLASS}
            value={yearValue(state.yearFrom)}
            onChange={(event) => patch({ yearFrom: parseYearSelect(event) })}
            aria-label="Başlangıç yılı"
          >
            <option value="">Tümü</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bitiş yılı">
          <select
            className={SELECT_CLASS}
            value={yearValue(state.yearTo)}
            onChange={(event) => patch({ yearTo: parseYearSelect(event) })}
            aria-label="Bitiş yılı"
          >
            <option value="">Tümü</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min. puan">
          <select
            className={SELECT_CLASS}
            value={state.minRating === 0 ? '' : String(state.minRating)}
            onChange={(event) => {
              const raw = Number(event.target.value);
              const valid = RATINGS.includes(raw as (typeof RATINGS)[number]);
              patch({ minRating: valid ? (raw as DiscoverFilterState['minRating']) : 0 });
            }}
            aria-label="Minimum puan"
          >
            <option value="">Tümü</option>
            {RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}+
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dil">
          <select
            className={SELECT_CLASS}
            value={state.language}
            onChange={(event) => patch({ language: event.target.value as DiscoverLanguage })}
            aria-label="Orijinal dil"
          >
            <option value="">Tümü</option>
            <option value="tr">Türkçe</option>
            <option value="en">İngilizce</option>
          </select>
        </Field>

        <Field label="Sıralama">
          <select
            className={SELECT_CLASS}
            value={state.sort}
            onChange={(event) => patch({ sort: event.target.value as DiscoverSortId })}
            aria-label="Sıralama"
          >
            {(Object.keys(SORT_LABELS) as DiscoverSortId[]).map((id) => (
              <option key={id} value={id}>
                {SORT_LABELS[id]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface ActiveFilterChipsProps {
  state: DiscoverFilterState;
  onChange: (next: DiscoverFilterState) => void;
}

/** Aktif filtre çipleri: tek tek kaldırma + "Temizle". Hiç filtre yoksa gizli. */
export function ActiveFilterChips({ state, onChange }: ActiveFilterChipsProps) {
  const chips = activeFilterChips(state);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          active
          aria-label={`Filtreyi kaldır: ${chip.label}`}
          onClick={() => onChange({ ...state, ...chip.patch })}
        >
          {chip.label}
          <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </Chip>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({ ...state, genres: [], yearFrom: null, yearTo: null, minRating: 0, language: '' })
        }
        className="ml-1 rounded-md px-2 py-1 text-sm font-medium text-secondary transition-colors duration-150 ease-cine hover:text-accent"
      >
        Temizle
      </button>
    </div>
  );
}
