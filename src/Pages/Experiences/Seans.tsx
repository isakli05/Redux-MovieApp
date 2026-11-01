/**
 * F1 — LMDB Seans: "bu akşam ne izlesem" karar yolculuğu (pm-seans).
 *
 * Altı adımlı sürükle-bırak değil, altı net soru: film/dizi → ruh hâli →
 * süre → türler → bilinen/yeni → (opsiyonel) yayın servisi. Sonuç: gerçek
 * TMDB discover verisi üzerinden deterministik puanlanmış, her biri gerçek
 * eşleşme sebepleriyle açıklanan adaylar. "Bu değil" reddi & değiştirme,
 * "izledim" günlüğü, geri alma ve hesaplı kaydetme dahil.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BoltIcon,
  BookOpenIcon,
  FaceSmileIcon,
  FilmIcon,
  FireIcon,
  HeartIcon,
  HomeIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  SunIcon,
  TvIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import { useRegion } from '@/hooks/useRegion';
import { useAddFavoriteMutation, useSetWatchlistMutation } from '@/api/user.api';
import { listInteractions, logInteraction, removeInteraction } from '@/lib/interactions';
import { parseMediaKey } from '@/lib/mediaRef';
import type { MediaRef } from '@/lib/mediaRef';
import {
  FAMILIARITIES,
  MAX_DISPLAYED,
  MOODS,
  RUNTIME_WINDOWS,
  STEP_IDS,
  moodDef,
  moodGenreIds,
  windowFromMinutes,
} from '@/lib/seans/config';
import {
  fetchCandidatePool,
  fetchGenreIdsOf,
  fetchGenres,
  fetchProviderCatalog,
  fetchSeedInfo,
  type ProviderCatalogEntry,
} from '@/lib/seans/api';
import { collectTasteTargets, deriveGenreAffinity, loadDnaWeights } from '@/lib/seans/taste';
import { excludedKeysFromLog, rankPool, runtimeLabel } from '@/lib/seans/rank';
import {
  applyLoosen,
  loadHistory,
  saveHistoryEntry,
  suggestLoosen,
  type LoosenSuggestion,
  type SeansHistoryEntry,
} from '@/lib/seans/session';
import type {
  FamiliarityId,
  MoodId,
  RankedCandidate,
  RuntimeWindowId,
  SeansAnswers,
  SeansKind,
} from '@/lib/seans/types';
import { CheckChips, RadioCards } from '@/components/Seans/OptionCards';
import { StepRail } from '@/components/Seans/StepRail';
import { SeansResults, type SeansLoadStatus, type UndoState } from '@/components/Seans/SeansResults';

type DraftAnswers = {
  kind: SeansKind | null;
  mood: MoodId | null;
  runtime: RuntimeWindowId | null;
  genres: number[];
  familiarity: FamiliarityId | null;
  providers: number[];
};

const INITIAL_DRAFT: DraftAnswers = {
  kind: null,
  mood: null,
  runtime: null,
  genres: [],
  familiarity: null,
  providers: [],
};

const STEP_QUESTIONS: Record<string, string> = {
  kind: 'Film mi, dizi mi?',
  mood: 'Nasıl bir şey istiyorsun?',
  runtime: 'Ne kadar vaktin var?',
  genres: 'Hangi türler yakınsın?',
  familiarity: 'Bilinen sular mı, yeni keşifler mi?',
  providers: 'Nerede izleyeceksin?',
};

const MOOD_ICONS: Record<MoodId, typeof BoltIcon> = {
  thrill: BoltIcon,
  laugh: FaceSmileIcon,
  feel: HeartIcon,
  mind: PuzzlePieceIcon,
  dark: FireIcon,
  epic: FilmIcon,
  cozy: SunIcon,
  real: BookOpenIcon,
};

interface UndoEntry {
  eventId: string;
  candidateKey: string;
  label: string;
}

export default function Seans() {
  useSEO({
    title: 'Seans',
    description: 'Bu akşam ne izlesem? Beş soruda, gerçek TMDB verisiyle sana özel üç aday.',
  });

  const { user, isAuthenticated } = useAuth();
  const accountId = isAuthenticated && user ? user.id : null;
  const { region, regions } = useRegion();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<DraftAnswers>(INITIAL_DRAFT);
  const [seedRef, setSeedRef] = useState<MediaRef | null>(null);
  const [seedGenreIds, setSeedGenreIds] = useState<number[]>([]);

  const [genreNamesByKind, setGenreNamesByKind] = useState<Partial<Record<SeansKind, Record<number, string>>>>({});
  const [genreFetchState, setGenreFetchState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [providerOptions, setProviderOptions] = useState<ProviderCatalogEntry[] | null>(null);

  const [status, setStatus] = useState<SeansLoadStatus>('ready');
  const [results, setResults] = useState<RankedCandidate[]>([]);
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [limit, setLimit] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loosen, setLoosen] = useState<LoosenSuggestion | null>(null);
  const [history, setHistory] = useState<SeansHistoryEntry[]>(() => loadHistory());

  const [addFavorite] = useAddFavoriteMutation();
  const [setWatchlist] = useSetWatchlistMutation();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const finalAnswersRef = useRef<SeansAnswers | null>(null);

  // --- Cinema Universe derin bağlantısı: ?seed=movie:123 / tv:123 ----------
  const [searchParams] = useSearchParams();
  const seedParam = useRef(searchParams.get('seed')).current;
  useEffect(() => {
    const parsed = seedParam ? parseMediaKey(seedParam) : null;
    if (!parsed || parsed.kind === 'person') return;
    const seedKind = parsed.kind as 'movie' | 'tv';
    let cancelled = false;
    fetchSeedInfo(seedKind, parsed.id)
      .then((info) => {
        if (cancelled) return;
        setSeedRef(info.ref);
        setSeedGenreIds(info.genreIds);
        setDraft((d) => ({
          ...d,
          kind: seedKind,
          genres: info.genreIds.slice(0, 4),
          runtime: windowFromMinutes(info.minutes, seedKind),
        }));
        setStepIndex(1);
      })
      .catch(() => {
        /* seed alınamadıysa normal akışta kal */
      });
    return () => {
      cancelled = true;
    };
  }, [seedParam]);

  // --- Adım geçişleri: odağı başlığa taşı, sayfayı yukarı al -----------------
  useEffect(() => {
    headingRef.current?.focus();
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }, [stepIndex]);

  // --- Tür listesi (türler adımına girince, tür başına bir kez) -------------
  useEffect(() => {
    if (stepIndex !== STEP_IDS.indexOf('genres') || !draft.kind) return;
    if (genreNamesByKind[draft.kind]) return;
    let cancelled = false;
    setGenreFetchState('loading');
    fetchGenres(draft.kind)
      .then((map) => {
        if (cancelled) return;
        setGenreNamesByKind((prev) => ({ ...prev, [draft.kind as SeansKind]: map }));
        setGenreFetchState('idle');
      })
      .catch(() => {
        if (!cancelled) setGenreFetchState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [stepIndex, draft.kind, genreNamesByKind]);

  // --- Sağlayıcı kataloğu (servis adımına girince) ---------------------------
  useEffect(() => {
    if (stepIndex !== STEP_IDS.indexOf('providers') || !draft.kind) return;
    if (providerOptions) return;
    let cancelled = false;
    fetchProviderCatalog(draft.kind, region)
      .then((options) => {
        if (!cancelled) setProviderOptions(options.slice(0, 12));
      })
      .catch(() => {
        if (!cancelled) setProviderOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [stepIndex, draft.kind, region, providerOptions]);

  // --- Sonuç üretimi ----------------------------------------------------------

  const buildFinal = useCallback(
    (source: DraftAnswers): SeansAnswers => ({
      kind: source.kind ?? 'movie',
      mood: source.mood,
      runtime: source.runtime ?? 'any',
      genres: source.genres,
      familiarity: source.familiarity,
      providers: source.providers,
      region,
      seed: seedRef,
    }),
    [region, seedRef],
  );

  const run = useCallback(
    async (final: SeansAnswers) => {
      finalAnswersRef.current = final;
      setStatus('loading');
      setUndoStack([]);
      setRemovedKeys(new Set());
      setLimit(3);
      try {
        const pool = await fetchCandidatePool(final);

        // Zevk akrabalığı: günlük sinyallerinin türleri (sınırlı detay zenginleştirmesi).
        const events = listInteractions(accountId);
        const targets = collectTasteTargets(events);
        const genreMap: Record<string, number[]> = {};
        await Promise.allSettled(
          [...targets.positive, ...targets.negative].map(async (ref) => {
            if (ref.kind === 'movie' || ref.kind === 'tv') {
              genreMap[`${ref.kind}:${ref.id}`] = await fetchGenreIdsOf(ref.kind, ref.id);
            }
          }),
        );
        const affinity = deriveGenreAffinity(events, genreMap);
        const dnaWeights = await loadDnaWeights();
        if (Object.keys(dnaWeights).length > 0) {
          affinity.hasData = true;
          for (const [genreId, weight] of Object.entries(dnaWeights)) {
            const id = Number(genreId);
            affinity.positive[id] = (affinity.positive[id] ?? 0) + weight;
          }
        }

        const ranked = rankPool(
          pool,
          final,
          {
            genreNames: genreNamesByKind[final.kind] ?? {},
            affinity,
            providerNames: {},
            seedGenreIds,
            now: Date.now(),
          },
          excludedKeysFromLog(events),
        );

        if (ranked.length === 0) {
          setResults([]);
          setLoosen(suggestLoosen(final));
          setStatus('empty');
        } else {
          setResults(ranked);
          setStatus('ready');
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error && error.message
            ? `Öneriler alınamadı: ${error.message}`
            : 'Öneriler alınamadı.',
        );
        setStatus('error');
      }
    },
    [accountId, genreNamesByKind, seedGenreIds],
  );

  // --- Adım gezinmesi ---------------------------------------------------------

  const canAdvance = useMemo(() => {
    switch (STEP_IDS[stepIndex]) {
      case 'kind':
        return draft.kind !== null;
      case 'mood':
        return draft.mood !== null;
      case 'runtime':
        return draft.runtime !== null;
      case 'genres':
        return draft.genres.length > 0;
      case 'familiarity':
        return draft.familiarity !== null;
      default:
        return true; // servisler opsiyonel
    }
  }, [stepIndex, draft]);

  const handleNext = useCallback(() => {
    if (!canAdvance) return;
    // Süre adımından türler adımına geçerken ruh hâli vekilleri ön seçilir.
    if (STEP_IDS[stepIndex] === 'runtime' && draft.genres.length === 0 && draft.mood && draft.kind) {
      setDraft((d) => ({ ...d, genres: moodGenreIds(d.mood as MoodId, d.kind as SeansKind) }));
    }
    if (stepIndex >= STEP_IDS.length - 1) {
      void run(buildFinal(draft));
      setStepIndex(STEP_IDS.length);
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [canAdvance, stepIndex, draft, run, buildFinal]);

  const handleBack = useCallback(() => {
    if (stepIndex === STEP_IDS.length) setStepIndex(STEP_IDS.length - 1);
    else if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const resetAll = useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setSeedRef(null);
    setSeedGenreIds([]);
    setResults([]);
    setRemovedKeys(new Set());
    setUndoStack([]);
    setLoosen(null);
    setStatus('ready');
    setStepIndex(0);
  }, []);

  // --- Aday aksiyonları: reddet / izledim / geri al / kaydet ------------------

  const removeCandidate = (ref: MediaRef, eventId: string, label: string) => {
    const key = `${ref.kind}:${ref.id}`;
    setRemovedKeys((prev) => new Set(prev).add(key));
    setUndoStack((prev) => [...prev, { eventId, candidateKey: key, label }]);
  };

  const handleReject = (ref: MediaRef) => {
    const event = logInteraction(
      { kind: 'seans_reject', target: ref, source: 'seans' },
      accountId,
    );
    removeCandidate(ref, event.id, `“${ref.title}” reddedildi`);
  };

  const handleWatched = (ref: MediaRef) => {
    const event = logInteraction({ kind: 'seen', target: ref, source: 'seans' }, accountId);
    removeCandidate(ref, event.id, `“${ref.title}” izlendi olarak işaretlendi`);
    setHistory(
      saveHistoryEntry({ at: Date.now(), title: ref.title ?? '', key: `${ref.kind}:${ref.id}` }),
    );
  };

  const undoTop: UndoState | null = useMemo(() => {
    const top = undoStack[undoStack.length - 1];
    if (!top) return null;
    return {
      label: top.label,
      onUndo: () => {
        removeInteraction(top.eventId, accountId);
        setRemovedKeys((prev) => {
          const next = new Set(prev);
          next.delete(top.candidateKey);
          return next;
        });
        setUndoStack((prev) => prev.slice(0, -1));
      },
    };
  }, [undoStack, accountId]);

  const handleFavorite = useCallback(
    async (ref: MediaRef): Promise<boolean> => {
      if (ref.kind === 'person') return false;
      logInteraction({ kind: 'like', target: ref, source: 'seans' }, accountId);
      try {
        await addFavorite({ mediaType: ref.kind, mediaId: ref.id, favorite: true }).unwrap();
        return true;
      } catch {
        return false;
      }
    },
    [addFavorite, accountId],
  );

  const handleWatchlist = useCallback(
    async (ref: MediaRef): Promise<boolean> => {
      if (ref.kind === 'person') return false;
      try {
        await setWatchlist({ mediaType: ref.kind, mediaId: ref.id, watchlist: true }).unwrap();
        return true;
      } catch {
        return false;
      }
    },
    [setWatchlist],
  );

  // --- Türemiş değerler --------------------------------------------------------

  const visible = useMemo(
    () => results.filter((r) => !removedKeys.has(`${r.candidate.ref.kind}:${r.candidate.ref.id}`)),
    [results, removedKeys],
  );
  const effectiveLimit = Math.min(limit, MAX_DISPLAYED);
  const exhausted = status === 'ready' && results.length > 0 && visible.length === 0;

  const genreNames = useMemo(
    () => (draft.kind ? (genreNamesByKind[draft.kind] ?? {}) : {}),
    [draft.kind, genreNamesByKind],
  );

  const recapChips = useMemo(() => {
    const chips: { label: string; step: number }[] = [];
    if (draft.kind) chips.push({ label: draft.kind === 'movie' ? 'Film' : 'Dizi', step: 0 });
    const mood = moodDef(draft.mood);
    if (mood) chips.push({ label: mood.label, step: 1 });
    if (draft.runtime) chips.push({ label: runtimeLabel(draft.runtime), step: 2 });
    if (draft.genres.length > 0) {
      const names = draft.genres
        .map((g) => genreNames[g])
        .filter((n): n is string => Boolean(n))
        .slice(0, 2);
      const extra = draft.genres.length - names.length;
      chips.push({
        label: names.length > 0 ? `${names.join(', ')}${extra > 0 ? ` +${extra}` : ''}` : `${draft.genres.length} tür`,
        step: 3,
      });
    }
    const fam = FAMILIARITIES.find((f) => f.id === draft.familiarity);
    if (fam) chips.push({ label: fam.label, step: 4 });
    chips.push({
      label: draft.providers.length > 0 ? `${draft.providers.length} servis` : 'Tüm servisler',
      step: 5,
    });
    return chips;
  }, [draft, genreNames]);

  const inResults = stepIndex === STEP_IDS.length;
  const currentStep = STEP_IDS[Math.min(stepIndex, STEP_IDS.length - 1)];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">
          LMDB Deneyimleri
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Seans
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
          Bu akşam ne izlesem? Altı kısa soruda zevkine göre perdeni kur; gerçek
          TMDB verisiyle sıralanmış, nedeni açık üç aday al.
        </p>
      </header>

      <StepRail current={Math.min(stepIndex, STEP_IDS.length - 1)} />

      {seedRef && !inResults && (
        <p className="mt-6 rounded-lg border border-line-strong bg-surface-overlay px-4 py-3 text-sm text-secondary">
          “{seedRef.title}” ile başladın — tür ve süre hazır, gerisini birlikte seçelim.
        </p>
      )}

      {!inResults ? (
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault();
            handleNext();
          }}
        >
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mb-6 font-display text-xl font-semibold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void rounded-sm"
          >
            {STEP_QUESTIONS[currentStep]}
          </h2>

          {currentStep === 'kind' && (
            <>
              <RadioCards
                name="seans-kind"
                legend="Medya türü"
                value={draft.kind}
                onChange={(value) => setDraft((d) => ({ ...d, kind: value as SeansKind }))}
                options={[
                  { value: 'movie', label: 'Film', hint: 'Tek seferde biten bir hikâye', icon: <FilmIcon className="h-6 w-6" /> },
                  { value: 'tv', label: 'Dizi', hint: 'Uzun soluklu bir dünya', icon: <TvIcon className="h-6 w-6" /> },
                ]}
              />
              {history.length > 0 && (
                <div className="mt-10">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                    Geçen seansların
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {history
                      .slice(-3)
                      .reverse()
                      .map((entry) => (
                        <li key={entry.key}>
                          <Link
                            to={`/${entry.key.replace(':', '/')}`}
                            className="inline-flex min-h-[2.5rem] items-center rounded-full border border-line-strong bg-surface-overlay px-4 text-sm text-secondary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void"
                          >
                            {entry.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {currentStep === 'mood' && (
            <>
              <RadioCards
                name="seans-mood"
                legend="Ruh hâli"
                columns="four"
                value={draft.mood}
                onChange={(value) => setDraft((d) => ({ ...d, mood: value as MoodId }))}
                options={MOODS.map((mood) => {
                  const Icon = MOOD_ICONS[mood.id];
                  return {
                    value: mood.id,
                    label: mood.label,
                    hint: mood.hint,
                    icon: <Icon className="h-6 w-6" />,
                  };
                })}
              />
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Ruh hâleti TMDB'de bir etiket değildir; seçimini tür, puan ve dönem
                ağırlıklarına çevirip dürüstçe eşleştiriyoruz.
              </p>
            </>
          )}

          {currentStep === 'runtime' && (
            <RadioCards
              name="seans-runtime"
              legend="Süre penceresi"
              columns="four"
              value={draft.runtime}
              onChange={(value) => setDraft((d) => ({ ...d, runtime: value as RuntimeWindowId }))}
              options={RUNTIME_WINDOWS.map((window) => ({
                value: window.id,
                label: window.label,
                hint: window.hint,
              }))}
            />
          )}

          {currentStep === 'genres' && (
            <>
              {genreFetchState === 'loading' && (
                <p className="text-sm text-secondary" role="status">
                  Türler yükleniyor…
                </p>
              )}
              {genreFetchState === 'error' && (
                <p className="text-sm text-danger" role="alert">
                  Tür listesi alınamadı. Bir adım geri gelip tekrar dene.
                </p>
              )}
              {genreFetchState === 'idle' && (
                <CheckChips
                  legend="Türler"
                  options={Object.entries(genreNames).map(([id, name]) => ({
                    value: Number(id),
                    label: name,
                  }))}
                  values={draft.genres}
                  onToggle={(value) =>
                    setDraft((d) => ({
                      ...d,
                      genres: d.genres.includes(value)
                        ? d.genres.filter((g) => g !== value)
                        : [...d.genres, value],
                    }))
                  }
                />
              )}
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Hiçbiri yakınında değilse yine de bir tane seç; kısıtları gevşetme
                önerisi sonuçta hazır.
              </p>
            </>
          )}

          {currentStep === 'familiarity' && (
            <RadioCards
              name="seans-familiarity"
              legend="Zevk yönü"
              value={draft.familiarity}
              onChange={(value) => setDraft((d) => ({ ...d, familiarity: value as FamiliarityId }))}
              options={FAMILIARITIES.map((fam) => ({
                value: fam.id,
                label: fam.label,
                hint: fam.hint,
                icon:
                  fam.id === 'familiar' ? (
                    <HomeIcon className="h-6 w-6" />
                  ) : (
                    <SparklesIcon className="h-6 w-6" />
                  ),
              }))}
            />
          )}

          {currentStep === 'providers' && (
            <>
              <div className="mb-5">
                <label
                  htmlFor="seans-region"
                  className="mb-1.5 block text-sm font-medium text-secondary"
                >
                  Bölge
                </label>
                <select
                  id="seans-region"
                  value={region}
                  onChange={() => {
                    /* bölge değişimi useRegion üzerinden Navbar'dan yapılır;
                       burada yalnızca görünürlük sağlanır */
                  }}
                  disabled
                  className="h-11 w-full max-w-xs rounded-lg border border-line-strong bg-surface-raised px-3 text-sm text-primary"
                >
                  <option value={region}>
                    {regions?.find((r) => r.iso_3166_1 === region)?.native_name ?? region}
                  </option>
                </select>
                <p className="mt-1.5 text-xs text-muted">
                  Bölge, üstteki gezgin çubuğundaki seçimden gelir ({region}).
                </p>
              </div>
              {providerOptions === null ? (
                <p className="text-sm text-secondary" role="status">
                  Yayın servisleri yükleniyor…
                </p>
              ) : providerOptions.length === 0 ? (
                <p className="text-sm text-muted">Bu bölge için servis listesi alınamadı — atlayabilirsin.</p>
              ) : (
                <CheckChips
                  legend="Yayın servisleri"
                  options={providerOptions.map((provider) => ({
                    value: provider.id,
                    label: provider.name,
                  }))}
                  values={draft.providers}
                  onToggle={(value) =>
                    setDraft((d) => ({
                      ...d,
                      providers: d.providers.includes(value)
                        ? d.providers.filter((p) => p !== value)
                        : [...d.providers, value],
                    }))
                  }
                />
              )}
            </>
          )}

          <div className="mt-10 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={stepIndex === 0}
            >
              Geri
            </Button>
            <Button type="submit" disabled={!canAdvance}>
              {currentStep === 'providers' ? 'Seansı oluştur' : 'Devam'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-xl font-semibold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void rounded-sm"
              >
                {exhausted ? 'Bu tur bitti' : 'Perden için adaylar'}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {recapChips.map((chip) => (
                  <button
                    key={`${chip.step}-${chip.label}`}
                    type="button"
                    onClick={() => setStepIndex(chip.step)}
                    className="inline-flex min-h-[2.25rem] items-center rounded-full border border-line-strong bg-surface-overlay px-3 text-xs font-medium text-secondary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="ghost" onClick={() => setStepIndex(0)}>
                Adımları düzenle
              </Button>
              <Button size="sm" variant="ghost" onClick={resetAll}>
                Baştan başla
              </Button>
            </div>
          </div>

          <SeansResults
            status={exhausted ? 'empty' : status}
            ranked={visible}
            limit={effectiveLimit}
            hasMore={visible.length > effectiveLimit}
            errorMessage={errorMessage}
            loosenNote={
              exhausted
                ? 'Bütün adayları tükettin. Kısıtları gevşetip daha geniş bir tarama yapalım.'
                : (loosen?.note ?? undefined)
            }
            onRetry={() => {
              const final = finalAnswersRef.current;
              if (final) void run(final);
            }}
            onLoosen={() => {
              const final = finalAnswersRef.current;
              if (!final) return;
              if (exhausted) {
                const next = applyLoosen(final, suggestLoosen(final));
                setDraft((d) => ({ ...d, ...next }));
                void run(next);
              } else if (loosen) {
                const next = applyLoosen(final, loosen);
                setDraft((d) => ({ ...d, ...next }));
                void run(next);
              }
            }}
            onMore={() => setLimit((l) => l + 3)}
            authed={isAuthenticated}
            onReject={handleReject}
            onWatched={handleWatched}
            onFavorite={handleFavorite}
            onWatchlist={handleWatchlist}
            undo={undoTop}
          />

          {!isAuthenticated && status === 'ready' && (
            <p className="mt-6 text-center text-xs text-muted">
              Favorilere ve izleme listesine kaydetmek için TMDB hesabınla giriş yapabilirsin;
              seans anonim de çalışır.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
