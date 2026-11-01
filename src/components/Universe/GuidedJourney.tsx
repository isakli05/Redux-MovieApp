/**
 * Cinema Universe — "Keşif yolculuğu": a short curated 3-hop traversal from a
 * seed with Turkish narration. Every hop follows a real fetched edge; hops
 * auto-expand the current node first.
 */

import { useState } from 'react';
import type { UniverseGraph } from '../../lib/universe/model';
import { EDGE_KIND_LABELS, isFactualKind } from '../../lib/universe/model';

export interface GuidedJourneyProps {
  graph: UniverseGraph;
  seedKey: string | null;
  /** Expands a node; resolves when the fetch settled. */
  onExpand: (key: string) => Promise<void> | void;
  onSelect: (key: string) => void;
  onRequestFocus: (key: string) => void;
}

interface JourneyStep {
  key: string;
  title: string;
  narration: string;
}

const HOPS = 3;

export default function GuidedJourney({ graph, seedKey, onExpand, onSelect, onRequestFocus }: GuidedJourneyProps) {
  const [steps, setSteps] = useState<JourneyStep[] | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!seedKey || busy) return;
    setBusy(true);
    setSteps([]);
    onSelect(seedKey);
    onRequestFocus(seedKey);
    const seed = graph.node(seedKey);
    const collected: JourneyStep[] = [
      {
        key: seedKey,
        title: seed?.title ?? seedKey,
        narration: `${seed?.title ?? 'Tohum'} ile başlıyoruz. Çevresindeki gerçek bağlantıları keşfedeceğiz.`,
      },
    ];
    setSteps([...collected]);

    let current = seedKey;
    const visited = new Set<string>([seedKey]);
    if (!graph.node(current)?.expanded) await onExpand(current);

    for (let hop = 1; hop <= HOPS; hop++) {
      const next = graph.pickJourneyStep(current, visited);
      if (!next) break;
      const from = graph.node(current);
      const to = graph.node(next);
      const edge = graph.edgeBetween(current, next);
      const via = edge
        ? `${EDGE_KIND_LABELS[edge.kind]}${edge.label ? ` — ${edge.label}` : ''}${
            !isFactualKind(edge.kind) ? ' (TMDB önerisi, gerçek kadro bağı değil)' : ''
          }`
        : 'bağlantı';
      collected.push({
        key: next,
        title: to?.title ?? next,
        narration: `Adım ${hop}: “${from?.title ?? current}” ile “${to?.title ?? next}” arasında ${via} bağı var.`,
      });
      visited.add(next);
      current = next;
      onSelect(next);
      onRequestFocus(next);
      setSteps([...collected]);
      if (!graph.node(current)?.expanded) await onExpand(current);
    }

    if (collected.length > 1) {
      const chain = collected.map((s) => `“${s.title}”`).join(' → ');
      collected.push({
        key: current,
        title: collected[collected.length - 1].title,
        narration: `Yolculuk tamamlandı: ${chain}.`,
      });
      setSteps([...collected]);
    } else {
      setSteps([
        ...collected,
        {
          key: seedKey,
          title: seed?.title ?? seedKey,
          narration: 'Bu düğümün henüz grafikte komşusu yok. “Komşuları getir” ile başla.',
        },
      ]);
    }
    setBusy(false);
  };

  return (
    <section
      aria-label="Keşif yolculuğu"
      className="rounded-lg border border-line bg-surface-raised p-4"
      data-testid="universe-journey"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base text-primary">Keşif yolculuğu</h3>
        <button
          type="button"
          onClick={run}
          disabled={!seedKey || busy}
          className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-ink transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {busy ? 'Yolculuk sürüyor…' : steps ? 'Yeniden başlat' : 'Başlat (3 adım)'}
        </button>
      </div>
      {steps && (
        <ol className="mt-3 space-y-2 text-sm text-secondary">
          {steps.map((step, i) => (
            <li key={`${step.key}-${i}`} className="border-t border-line pt-2">
              <p>{step.narration}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
