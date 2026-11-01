/**
 * Ev sahibi kısıt formu: tür (film/dizi), süre, türler, bölge ve yayın
 * sağlayıcıları. Aday üretimi bu kısıtlarla SUNUCUDA yapılır (BFF discover).
 */

import { useEffect, useState } from 'react';
import { Chip, Button } from '../ui';
import { genresFor } from '../Discover/genres';
import type { GroupApi, ProviderOption, RoomConstraints } from '../../lib/group/api';
import { REGIONS } from '../../lib/group/core';

export const REGION_LABELS: Record<string, string> = {
  TR: 'Türkiye',
  US: 'ABD',
  DE: 'Almanya',
  GB: 'İngiltere',
};

const RUNTIME_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Sınır yok' },
  { value: 90, label: '≤ 90 dk' },
  { value: 120, label: '≤ 2 sa' },
  { value: 150, label: '≤ 2,5 sa' },
  { value: 180, label: '≤ 3 sa' },
];

interface ConstraintsFormProps {
  api: GroupApi;
  value: RoomConstraints;
  busy: boolean;
  onSave: (constraints: RoomConstraints) => void;
}

export function ConstraintsForm({ api, value, busy, onSave }: ConstraintsFormProps) {
  const [draft, setDraft] = useState<RoomConstraints>(value);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [showProviders, setShowProviders] = useState(value.providers.length > 0);

  // Kısıtlar sunucuya kaydedildikten sonra formu dış değerle eşle. Poll her
  // seferinde YENİ nesne kimliği döndürür; yalnız anlamsal değişimde eşle ki
  // ev sahibinin yarım kalan seçimi 4 saniyede bir ezilmesin.
  const valueKey = JSON.stringify(value);
  useEffect(() => {
    setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey]);

  useEffect(() => {
    let alive = true;
    api.providers(draft.mediaType, draft.region)
      .then((list) => {
        if (alive) setProviders(list);
      })
      .catch(() => {
        if (alive) setProviders([]);
      });
    return () => {
      alive = false;
    };
  }, [api, draft.mediaType, draft.region]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(value);
  const genreOptions = genresFor(draft.mediaType);

  const toggleGenre = (id: number) =>
    setDraft((d) => ({
      ...d,
      genres: d.genres.includes(id) ? d.genres.filter((g) => g !== id) : [...d.genres, id].slice(-4),
    }));

  const toggleProvider = (id: number) =>
    setDraft((d) => ({
      ...d,
      providers: d.providers.includes(id)
        ? d.providers.filter((p) => p !== id)
        : [...d.providers, id].slice(-6),
    }));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <fieldset className="space-y-4" disabled={busy}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-sm text-secondary">Ne izleyeceksiniz?</span>
          {(['movie', 'tv'] as const).map((t) => (
            <Chip
              key={t}
              active={draft.mediaType === t}
              onClick={() => setDraft((d) => ({ ...d, mediaType: t, genres: [], providers: [] }))}
            >
              {t === 'movie' ? 'Film' : 'Dizi'}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-sm text-secondary">Süre</span>
          {RUNTIME_OPTIONS.map((o) => (
            <Chip
              key={String(o.value)}
              active={draft.maxRuntime === o.value}
              onClick={() => setDraft((d) => ({ ...d, maxRuntime: o.value }))}
            >
              {o.label}
            </Chip>
          ))}
        </div>

        <div>
          <span className="text-sm text-secondary">Türler (en çok 4)</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {genreOptions.map((g) => (
              <Chip key={g.id} active={draft.genres.includes(g.id)} onClick={() => toggleGenre(g.id)}>
                {g.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-sm text-secondary">Bölge</span>
          {REGIONS.map((r) => (
            <Chip
              key={r}
              active={draft.region === r}
              onClick={() => setDraft((d) => ({ ...d, region: r, providers: [] }))}
            >
              {REGION_LABELS[r] ?? r}
            </Chip>
          ))}
        </div>

        <div>
          <button
            type="button"
            className="text-sm text-accent underline-offset-4 hover:underline"
            onClick={() => setShowProviders((s) => !s)}
            aria-expanded={showProviders}
          >
            {showProviders ? 'Yayın sağlayıcılarını gizle' : 'Yayın sağlayıcılarına göre sınırla'}
          </button>
          {showProviders && (
            <div className="mt-2 flex flex-wrap gap-2">
              {providers.length === 0 && (
                <span className="text-sm text-muted">Sağlayıcı listesi yüklenemedi.</span>
              )}
              {providers.map((p) => (
                <Chip key={p.id} active={draft.providers.includes(p.id)} onClick={() => toggleProvider(p.id)}>
                  {p.name}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <Button type="submit" disabled={busy || !dirty}>
        Kısıtları Kaydet
      </Button>
    </form>
  );
}
