/**
 * F3 — Cinema Universe (Sinema Evreni): interactive graph of movies, TV, people
 * and collections. Edges are factual TMDB credits/collection data; TMDB
 * recommendation edges are always dashed + labeled as similarity.
 *
 * Entry: /evren or /evren?focus=movie:550|tv:1399|person:287 (deep link seed).
 * Without a focus param the current trending #1 seeds the graph.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { moviesApi, useGetTrendingMixedQuery } from '../../api/endpoints/movies.endpoints';
import { tvApi } from '../../api/endpoints/tv.endpoints';
import { personsApi } from '../../api/endpoints/persons.endpoints';
import { usePrefersReducedMotion } from '../../components/Home/HomeHero';
import ConnectionChallenge from '../../components/Universe/ConnectionChallenge';
import GuidedJourney from '../../components/Universe/GuidedJourney';
import UniverseCanvas from '../../components/Universe/UniverseCanvas';
import UniverseDetailsPanel from '../../components/Universe/UniverseDetailsPanel';
import UniverseListView from '../../components/Universe/UniverseListView';
import { createExpansionController, type AbortablePromise } from '../../lib/universe/controller';
import type { RawMovieFull, RawPersonFull, RawTvFull } from '../../lib/universe/expand';
import { CAPS, UniverseGraph } from '../../lib/universe/model';
import { parseMediaKey, type MediaRef } from '../../lib/mediaRef';

const PAGE_CONTAINER = 'mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:py-14 lg:px-8';

/** RTK lazy trigger → controller fetcher (keeps the trigger's abort()). */
function wrapTrigger<T>(
  trig: (id: string) => { then(onfulfilled: (r: { data?: unknown }) => T): Promise<T>; abort(): void },
  id: number,
): AbortablePromise<T> {
  const promise = trig(String(id));
  const out = promise.then((r) => r.data as T) as AbortablePromise<T>;
  out.abort = () => promise.abort();
  return out;
}

export default function SinemaEvreni() {
  const [params] = useSearchParams();
  const focusParam = params.get('focus');
  const reducedMotion = usePrefersReducedMotion();

  const graphRef = useRef(new UniverseGraph());
  const graph = graphRef.current;
  const [version, setVersion] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'list'>(reducedMotion ? 'list' : 'graph');
  const [focusRequest, setFocusRequest] = useState<{ key: string; nonce: number } | null>(null);

  // --- seed -----------------------------------------------------------------

  const deepSeed = useMemo<MediaRef | null>(() => {
    const parsed = focusParam ? parseMediaKey(focusParam) : null;
    return parsed ? { kind: parsed.kind, id: parsed.id } : null;
  }, [focusParam]);

  const trending = useGetTrendingMixedQuery({ timeWindow: 'day' }, { skip: Boolean(deepSeed) });
  const autoSeed = useMemo<MediaRef | null>(() => {
    const first = trending.data?.results?.find(
      (item) => item.media_type === 'movie' || item.media_type === 'tv',
    );
    return first ? { kind: first.media_type, id: first.id, title: first.title } : null;
  }, [trending.data]);

  const seed = deepSeed ?? autoSeed;

  // --- expansion ------------------------------------------------------------

  // Lazy hooks live on the injected api objects (endpoint files re-export only
  // the non-lazy variants); one lazy trigger per node kind.
  const [trigMovie] = moviesApi.useLazyGetMovieDetailFullQuery();
  const [trigTv] = tvApi.useLazyGetTvDetailFullQuery();
  const [trigPerson] = personsApi.useLazyGetPersonDetailsQuery();

  const controller = useMemo(
    () =>
      createExpansionController({
        movie: (id) => wrapTrigger<RawMovieFull | undefined>(trigMovie, id),
        tv: (id) => wrapTrigger<RawTvFull | undefined>(trigTv, id),
        person: (id) => wrapTrigger<RawPersonFull | undefined>(trigPerson, id),
      }),
    [trigMovie, trigTv, trigPerson],
  );

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const requestFocus = useCallback(
    (key: string) => setFocusRequest({ key, nonce: Date.now() }),
    [],
  );

  const expand = useCallback(
    async (key: string): Promise<void> => {
      const node = graph.nodes.get(key);
      if (!node || node.expanded) return;
      if (node.kind === 'collection') {
        node.expanded = true;
        bump();
        return;
      }
      const ref = parseMediaKey(key);
      if (!ref) return;
      setLoadingKeys((prev) => new Set(prev).add(key));
      setNotice(null);
      try {
        const expansion = await controller.expand({ kind: ref.kind, id: ref.id });
        if (expansion) {
          const report = graph.add(expansion.nodes, expansion.edges);
          const mutated = graph.nodes.get(key);
          if (mutated) mutated.expanded = true;
          if (report.hitCap) {
            setNotice(
              `Oturum sınırına ulaşıldı (≤${CAPS.nodes} düğüm / ≤${CAPS.edges} bağlantı). Yeni bağlantılar için bazı düğümleri kaldır.`,
            );
          }
          bump();
        } else {
          // controller already fetched this key earlier in the session
          const mutated = graph.nodes.get(key);
          if (mutated) mutated.expanded = true;
          bump();
        }
      } catch (error) {
        const name = (error as { name?: string } | undefined)?.name;
        if (name !== 'AbortError' && name !== 'ConditionError') {
          setNotice('Komşular getirilemedi — tekrar dene.');
        }
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [bump, controller, graph],
  );

  // Seed once per deep link / first trending result.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seed || seededRef.current || graph.nodes.size > 0) return;
    seededRef.current = true;
    const key = `${seed.kind}:${seed.id}`;
    graph.add([{ key, kind: seed.kind, id: seed.id, title: seed.title ?? key }], []);
    setSelectedKey(key);
    bump();
    void expand(key);
  }, [seed, expand, bump, graph]);

  const dismiss = useCallback(
    (key: string) => {
      graph.removeNode(key);
      setSelectedKey((current) => (current === key ? null : current));
      bump();
    },
    [bump, graph],
  );

  const selectedNode = selectedKey ? graph.nodes.get(selectedKey) : undefined;

  return (
    <div className={PAGE_CONTAINER}>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Etkileşimli deneyim</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-primary md:text-4xl">
          Sinema Evreni
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Filmler, diziler ve kişiler gerçek kadro ve koleksiyon bağlantılarıyla birbirine bağlanır.
          Bir düğüme tıkla, komşularını getir, evreni büyüt. Kesikli çizgiler{' '}
          <span className="text-primary">benzerlik önerisidir</span> — gerçek kadro bağı değildir.
        </p>
        {trending.isError && !deepSeed && (
          <p className="mt-2 text-xs text-secondary">
            Gündem yüklenemedi. Bir yapı sayfasındaki{' '}
            <span className="text-primary">“Evrende gör”</span> düğmesiyle ya da{' '}
            <code className="text-primary">/evren?focus=movie:550</code> gibi bir bağlantıyla başla.
          </p>
        )}
      </header>

      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3" role="toolbar" aria-label="Görünüm ve modlar">
        <div className="flex rounded-md border border-line-strong p-0.5" role="group" aria-label="Görünüm">
          {(['graph', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`h-8 rounded px-3 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                view === mode ? 'bg-accent text-accent-ink' : 'text-secondary hover:text-primary'
              }`}
            >
              {mode === 'graph' ? 'Grafik' : 'Liste (erişilebilir)'}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted" data-testid="universe-caps">
          {graph.nodes.size}/{CAPS.nodes} düğüm · {graph.edges.size}/{CAPS.edges} bağlantı
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-5 bg-text-secondary" aria-hidden="true" /> gerçek bağlantı
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-0 w-5 border-t border-dashed border-text-muted"
              aria-hidden="true"
            />{' '}
            benzerlik (TMDB önerisi)
          </span>
        </div>
      </div>

      {notice && (
        <p role="status" className="mb-4 rounded-md border border-line bg-surface-raised p-3 text-xs text-secondary">
          {notice}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[62vh] min-h-[380px] lg:h-[72vh]">
          {view === 'graph' ? (
            <UniverseCanvas
              graph={graph}
              version={version}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onExpand={expand}
              reducedMotion={reducedMotion}
              focusRequest={focusRequest}
            />
          ) : (
            <UniverseListView
              graph={graph}
              version={version}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />
          )}
        </div>

        <aside className="space-y-4" aria-label="Seçili düğüm ve modlar">
          <div className="rounded-lg border border-line bg-surface-raised">
            <UniverseDetailsPanel
              node={selectedNode}
              graph={graph}
              loading={Boolean(selectedKey && loadingKeys.has(selectedKey))}
              onExpand={expand}
              onDismiss={dismiss}
              onCenter={requestFocus}
            />
          </div>
          <GuidedJourney
            graph={graph}
            seedKey={seed ? `${seed.kind}:${seed.id}` : null}
            onExpand={expand}
            onSelect={setSelectedKey}
            onRequestFocus={requestFocus}
          />
          <ConnectionChallenge graph={graph} version={version} onRequestFocus={requestFocus} />
          <p className="text-[11px] text-muted">
            Veri: TMDB kadroları ve koleksiyonları. Benzerlik kenarları TMDB öneri servisinden gelir
            ve kesikli çizgiyle etiketlenir. <Link to="/" className="text-secondary underline-offset-2 hover:underline">Ana sayfa</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
