/**
 * Cinema Universe — selected node details panel: poster, quick facts, links to
 * real detail pages and Seans, expand/dismiss actions.
 */

import { Link } from 'react-router-dom';
import type { UniverseGraph, UniverseNode } from '../../lib/universe/model';
import { NODE_KIND_LABELS } from '../../lib/universe/model';
import { TMDB_CONFIG } from '../../utils/constants';

export interface UniverseDetailsPanelProps {
  node: UniverseNode | undefined;
  graph: UniverseGraph;
  loading: boolean;
  onExpand: (key: string) => void;
  onDismiss: (key: string) => void;
  onCenter: (key: string) => void;
}

export default function UniverseDetailsPanel({
  node,
  graph,
  loading,
  onExpand,
  onDismiss,
  onCenter,
}: UniverseDetailsPanelProps) {
  if (!node) {
    return (
      <p className="p-4 text-sm text-muted" data-testid="universe-details-empty">
        Bir düğüme dokunun veya tıklayın — burada künyesi ve bağlantıları görünür.
      </p>
    );
  }

  const detailPath = node.kind === 'collection' ? null : `/${node.kind}/${node.id}`;
  const seansPath =
    node.kind === 'movie' || node.kind === 'tv' ? `/seans?seed=${node.key}` : null;
  const facts: string[] = [];
  if (node.year) facts.push(node.year);
  if (node.voteAverage && node.voteAverage > 0) facts.push(`${node.voteAverage.toFixed(1)}/10`);
  if (node.department) facts.push(node.department);

  return (
    <div className="flex flex-col gap-3 p-4" data-testid="universe-details-panel">
      <div className="flex gap-3">
        {node.posterPath ? (
          <img
            src={`${TMDB_CONFIG.IMAGE_BASE_URL}/w185${node.posterPath}`}
            alt=""
            className="h-28 w-[74px] shrink-0 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-28 w-[74px] shrink-0 items-center justify-center rounded border border-line bg-surface-raised text-2xl font-display text-muted">
            {node.title.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg text-primary">{node.title}</h2>
          <p className="text-xs text-secondary">
            {NODE_KIND_LABELS[node.kind]}
            {facts.length > 0 ? ` · ${facts.join(' · ')}` : ''}
          </p>
          <p className="mt-1 text-xs text-muted">{graph.degree(node.key)} bağlantı</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCenter(node.key)}
          className="h-8 rounded-md border border-line-strong px-3 text-xs text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Ortala
        </button>
        <button
          type="button"
          onClick={() => onExpand(node.key)}
          disabled={node.expanded || loading || node.kind === 'collection'}
          className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-ink transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {loading ? 'Getiriliyor…' : node.expanded ? 'Komşuları getirildi' : 'Komşuları getir'}
        </button>
        <button
          type="button"
          onClick={() => onDismiss(node.key)}
          className="h-8 rounded-md border border-line-strong px-3 text-xs text-secondary transition-colors hover:border-danger hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Kaldır
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {detailPath && (
          <Link
            to={detailPath}
            className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Detay sayfası →
          </Link>
        )}
        {seansPath && (
          <Link
            to={seansPath}
            className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Buna benzer öner (Seans) →
          </Link>
        )}
      </div>
    </div>
  );
}
