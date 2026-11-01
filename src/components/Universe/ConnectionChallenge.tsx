/**
 * Cinema Universe — "İki yapı arası bağlantı" challenge. Players walk from A to
 * B strictly along real fetched edges (BFS over the current subgraph decides
 * connectivity, par and hints — never inferred edges).
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { UniverseGraph } from '../../lib/universe/model';
import { EDGE_KIND_LABELS } from '../../lib/universe/model';

export interface ConnectionChallengeProps {
  graph: UniverseGraph;
  version: number; // re-render on graph mutation
  onRequestFocus: (key: string) => void;
}

type Phase = 'setup' | 'playing' | 'won' | 'given-up';

/** Works (yapı) = movie/tv nodes; persons are the connections between them. */
function works(graph: UniverseGraph): string[] {
  return graph
    .nodeArray()
    .filter((n) => n.kind === 'movie' || n.kind === 'tv')
    .map((n) => n.key);
}

export default function ConnectionChallenge({ graph, onRequestFocus }: ConnectionChallengeProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [aKey, setAKey] = useState('');
  const [bKey, setBKey] = useState('');
  const [current, setCurrent] = useState('');
  const [steps, setSteps] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // graph is a stable mutable instance; recompute per render (≤120 nodes, cheap)
  const options = works(graph);
  const title = (key: string) => graph.node(key)?.title ?? key;
  const kindOf = (key: string) => graph.node(key)?.kind ?? 'movie';

  const par = useMemo(() => {
    if (phase !== 'playing' || !aKey || !bKey) return null;
    const path = graph.bfsPath(current || aKey, bKey);
    return path ? path.length - 1 : null;
  }, [graph, phase, aKey, bKey, current]);

  const start = () => {
    setMessage(null);
    if (!aKey || !bKey || aKey === bKey) {
      setMessage('İki farklı yapı seç.');
      return;
    }
    const path = graph.bfsPath(aKey, bKey);
    if (!path) {
      setMessage(
        'Bu iki yapı, şu anki grafikte henüz bağlantılı değil. Düğümlerin “Komşuları getir” ile ağı büyüt ve tekrar dene.',
      );
      return;
    }
    setPhase('playing');
    setCurrent(aKey);
    setSteps(0);
    setVisited([aKey]);
    setHint(null);
    onRequestFocus(aKey);
  };

  const randomPair = () => {
    const pool = works(graph);
    if (pool.length < 2) {
      setMessage('Grafikte en az iki film/dizi gerekli.');
      return;
    }
    for (let tries = 0; tries < 30; tries++) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      const b = pool[Math.floor(Math.random() * pool.length)];
      if (a !== b && graph.bfsPath(a, b)) {
        setAKey(a);
        setBKey(b);
        setMessage(null);
        return;
      }
    }
    setMessage('Bağlantılı rastgele çift bulunamadı — ağı büyütüp tekrar dene.');
  };

  const move = (key: string) => {
    if (phase !== 'playing') return;
    setSteps((s) => s + 1);
    setCurrent(key);
    setVisited((v) => (v.includes(key) ? v : [...v, key]));
    setHint(null);
    onRequestFocus(key);
    if (key === bKey) setPhase('won');
  };

  const giveUp = () => {
    setPhase('given-up');
    setHint(null);
  };

  const path = aKey && bKey ? graph.bfsPath(aKey, bKey) : null;
  const neighborEntries = phase === 'playing' ? [...graph.neighborsOf(current).entries()] : [];

  return (
    <section
      aria-label="İki yapı arası bağlantı oyunu"
      className="rounded-lg border border-line bg-surface-raised p-4"
      data-testid="universe-challenge"
    >
      <h3 className="font-display text-base text-primary">İki yapı arası bağlantı</h3>

      {phase === 'setup' && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-secondary" htmlFor="challenge-a">
              A
            </label>
            <select
              id="challenge-a"
              value={aKey}
              onChange={(e) => setAKey(e.target.value)}
              className="h-8 max-w-[11rem] rounded border border-line-strong bg-surface-void px-2 text-xs text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <option value="">Seç…</option>
              {options.map((key) => (
                <option key={key} value={key}>
                  {title(key)}
                </option>
              ))}
            </select>
            <label className="text-secondary" htmlFor="challenge-b">
              B
            </label>
            <select
              id="challenge-b"
              value={bKey}
              onChange={(e) => setBKey(e.target.value)}
              className="h-8 max-w-[11rem] rounded border border-line-strong bg-surface-void px-2 text-xs text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <option value="">Seç…</option>
              {options.map((key) => (
                <option key={key} value={key}>
                  {title(key)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={randomPair}
              className="h-8 rounded-md border border-line-strong px-2 text-xs text-secondary hover:border-accent hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Rastgele çift
            </button>
            <button
              type="button"
              onClick={start}
              className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-ink hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Başla
            </button>
          </div>
          {message && <p className="text-xs text-secondary">{message}</p>}
          <p className="text-xs text-muted">
            A’dan B’ye yalnızca gerçek kadro/koleksiyon bağlantıları üzerinden gitmeye çalış. Kişi
            düğümleri köprüdür.
          </p>
        </div>
      )}

      {phase === 'playing' && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-secondary" aria-live="polite">
            Şu an: <span className="text-primary">{title(current)}</span> → Hedef:{' '}
            <span className="text-primary">{title(bKey)}</span> · {steps} hamle
            {par !== null ? ` (en kısa: ${par})` : ''}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {neighborEntries.map(([key, edge]) => (
              <button
                key={key}
                type="button"
                onClick={() => move(key)}
                className="h-8 rounded-md border border-line-strong px-2 text-xs text-primary hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {title(key)}
                <span className="ml-1 text-muted">({EDGE_KIND_LABELS[edge.kind].toLowerCase()})</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const p = graph.bfsPath(current, bKey);
                setHint(p && p.length > 1 ? title(p[1]) : 'Zaten hedefe bitişiksin.');
              }}
              className="h-8 rounded-md border border-line-strong px-3 text-xs text-secondary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              İpucu
            </button>
            <button
              type="button"
              onClick={giveUp}
              className="h-8 rounded-md border border-line-strong px-3 text-xs text-secondary hover:border-danger hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Pes et
            </button>
          </div>
          {hint && (
            <p className="text-xs text-accent" role="status">
              İpucu: “{hint}” yönüne git.
            </p>
          )}
        </div>
      )}

      {(phase === 'won' || phase === 'given-up') && (
        <div className="mt-3 space-y-2 text-sm">
          <p className={phase === 'won' ? 'text-accent' : 'text-secondary'}>
            {phase === 'won'
              ? `Başardın! “${title(bKey)}”e ${steps} hamlede ulaştın.`
              : 'Tamamı bu kadar — en kısa yol şuydu:'}
          </p>
          {path && (
            <ol className="flex flex-wrap items-center gap-1 text-xs">
              {path.map((key, i) => (
                <li key={key} className="flex items-center gap-1">
                  {i > 0 && <span className="text-muted">→</span>}
                  {graph.node(key)?.kind === 'collection' ? (
                    <span className="text-secondary">{title(key)}</span>
                  ) : (
                    <Link
                      to={`/${kindOf(key)}/${graph.node(key)?.id}`}
                      className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {title(key)}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          )}
          <button
            type="button"
            onClick={() => {
              setPhase('setup');
              setMessage(null);
              setSteps(0);
              setVisited([]);
            }}
            className="h-8 rounded-md border border-line-strong px-3 text-xs text-secondary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Yeni oyun
          </button>
        </div>
      )}

      {phase === 'setup' && visited.length === 0 && graph.nodeArray().length === 0 && (
        <p className="mt-2 text-xs text-muted">Grafik boş — önce bir odak aç.</p>
      )}
    </section>
  );
}
