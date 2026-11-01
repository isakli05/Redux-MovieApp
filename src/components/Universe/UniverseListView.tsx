/**
 * Cinema Universe — accessible list alternative to the canvas: the same graph
 * data as a DOM list for screen readers, keyboard and reduced-motion users.
 */

import { Link } from 'react-router-dom';
import type { UniverseGraph } from '../../lib/universe/model';
import { NODE_KIND_LABELS } from '../../lib/universe/model';

export interface UniverseListViewProps {
  graph: UniverseGraph;
  version: number; // re-render on graph mutation
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export default function UniverseListView({ graph, selectedKey, onSelect }: UniverseListViewProps) {
  const rows = graph
    .nodeArray()
    .map((node) => ({ node, degree: graph.degree(node.key) }))
    .sort((a, b) => b.degree - a.degree || a.node.title.localeCompare(b.node.title, 'tr'));

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-line bg-surface-void p-2">
      <table className="w-full text-left text-sm" data-testid="universe-list-table">
        <caption className="sr-only">
          Grafikteki tüm düğümler, bağlantı sayısına göre sıralı liste görünümü
        </caption>
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="px-2 py-1 font-medium">Başlık</th>
            <th scope="col" className="px-2 py-1 font-medium">Tür</th>
            <th scope="col" className="px-2 py-1 font-medium">Bağlantı</th>
            <th scope="col" className="px-2 py-1 font-medium">Detay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ node, degree }) => (
            <tr
              key={node.key}
              className={`border-t border-line ${selectedKey === node.key ? 'bg-surface-raised' : ''}`}
            >
              <td className="max-w-[12rem] truncate px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => onSelect(node.key)}
                  aria-pressed={selectedKey === node.key}
                  className={`truncate text-left hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                    selectedKey === node.key ? 'text-accent' : 'text-primary'
                  }`}
                >
                  {node.title}
                  {node.year ? <span className="text-muted"> ({node.year})</span> : null}
                </button>
              </td>
              <td className="px-2 py-1.5 text-xs text-secondary">{NODE_KIND_LABELS[node.kind]}</td>
              <td className="px-2 py-1.5 text-xs text-secondary">{degree}</td>
              <td className="px-2 py-1.5 text-xs">
                {node.kind === 'collection' ? (
                  <span className="text-muted">—</span>
                ) : (
                  <Link
                    to={`/${node.kind}/${node.id}`}
                    className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Aç
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
