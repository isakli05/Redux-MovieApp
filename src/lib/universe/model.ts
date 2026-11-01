/**
 * Cinema Universe — pure graph model (no React, no network).
 *
 * Edge honesty rule (SHARED_CONTRACTS + feature brief): every edge kind except
 * `similarity` is FACTUAL TMDB data (credits/collections). `similarity` edges
 * come from TMDB recommendations and must always be visually labeled as such.
 *
 * Edge direction is normalized so an edge added from either endpoint dedupes:
 *   cast/crew/director/creator → media node is source, person is target
 *   collection                → member movie is source, collection is target
 *   similarity                → expanded node is source, recommendation target
 */

export type UniverseNodeKind = 'movie' | 'tv' | 'person' | 'collection';

export type EdgeKind = 'cast' | 'crew' | 'director' | 'creator' | 'collection' | 'similarity';

export interface UniverseNode {
  key: string;
  kind: UniverseNodeKind;
  id: number;
  title: string;
  posterPath?: string | null;
  /** Release/first-air year. */
  year?: string;
  voteAverage?: number;
  /** person: known_for_department. */
  department?: string;
  /** Neighbors already fetched (progressive expansion guard). */
  expanded?: boolean;
  /** Mutated by the d3-force simulation; seed values before first layout. */
  x?: number;
  y?: number;
}

export interface UniverseEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  /** character / job / "benzer" — factual detail from the credit row. */
  label?: string;
}

/** Hard session caps (feature brief): ~120 nodes / ~300 edges. */
export const CAPS = { nodes: 120, edges: 300 } as const;

export const FACTUAL_KINDS: ReadonlySet<EdgeKind> = new Set<EdgeKind>([
  'cast',
  'crew',
  'director',
  'creator',
  'collection',
]);

export function isFactualKind(kind: EdgeKind): boolean {
  return kind !== 'similarity';
}

export function nodeKey(kind: UniverseNodeKind, id: number): string {
  return `${kind}:${id}`;
}

export function edgeId(source: string, kind: EdgeKind, target: string): string {
  return `${source}|${kind}|${target}`;
}

/** Turkish labels for the legend, list view and screen readers. */
export const EDGE_KIND_LABELS: Record<EdgeKind, string> = {
  cast: 'Oyunculuk',
  crew: 'Ekip',
  director: 'Yönetmen',
  creator: 'Yaratıcı',
  collection: 'Koleksiyon',
  similarity: 'Benzerlik (TMDB önerisi)',
};

export const NODE_KIND_LABELS: Record<UniverseNodeKind, string> = {
  movie: 'Film',
  tv: 'Dizi',
  person: 'Kişi',
  collection: 'Koleksiyon',
};

export interface AddReport {
  addedNodes: UniverseNode[];
  addedEdges: UniverseEdge[];
  /** True when candidates were dropped because a cap would be exceeded. */
  hitCap: boolean;
}

export class UniverseGraph {
  readonly nodes = new Map<string, UniverseNode>();
  readonly edges = new Map<string, UniverseEdge>();

  /**
   * Adds nodes/edges with dedupe and cap enforcement. Factual edges win over
   * similarity edges when the edge cap forces a choice (stable within groups).
   */
  add(newNodes: Iterable<UniverseNode>, newEdges: Iterable<UniverseEdge>): AddReport {
    const addedNodes: UniverseNode[] = [];
    for (const node of newNodes) {
      const existing = this.nodes.get(node.key);
      if (existing) {
        // enrich a bare deep-link seed (title was its key) once real data arrives
        if (existing.title === existing.key) existing.title = node.title;
        if (existing.posterPath === undefined && node.posterPath !== undefined) {
          existing.posterPath = node.posterPath;
        }
        if (existing.year === undefined && node.year !== undefined) existing.year = node.year;
        if (existing.voteAverage === undefined && node.voteAverage !== undefined) {
          existing.voteAverage = node.voteAverage;
        }
        if (existing.department === undefined && node.department !== undefined) {
          existing.department = node.department;
        }
        continue;
      }
      if (this.nodes.size >= CAPS.nodes) break;
      this.nodes.set(node.key, node);
      addedNodes.push(node);
    }

    // factual edges sort before similarity when the cap forces a choice
    const candidates = [...newEdges].sort(
      (a, b) => Number(isFactualKind(b.kind)) - Number(isFactualKind(a.kind)),
    );
    const addedEdges: UniverseEdge[] = [];
    let hitCap = false;
    for (const edge of candidates) {
      if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) continue;
      if (this.edges.has(edge.id)) continue;
      if (this.edges.size >= CAPS.edges) {
        hitCap = true;
        continue;
      }
      this.edges.set(edge.id, edge);
      addedEdges.push(edge);
    }
    return { addedNodes, addedEdges, hitCap };
  }

  /** Dismisses a node and every edge touching it (frees cap space). */
  removeNode(key: string): void {
    this.nodes.delete(key);
    for (const [id, edge] of this.edges) {
      if (edge.source === key || edge.target === key) this.edges.delete(id);
    }
  }

  node(key: string): UniverseNode | undefined {
    return this.nodes.get(key);
  }

  nodeArray(): UniverseNode[] {
    return [...this.nodes.values()];
  }

  edgeArray(): UniverseEdge[] {
    return [...this.edges.values()];
  }

  /** All nodes directly connected to `key`, with the connecting edge. */
  neighborsOf(key: string): Map<string, UniverseEdge> {
    const out = new Map<string, UniverseEdge>();
    for (const edge of this.edges.values()) {
      if (edge.source === key) out.set(edge.target, edge);
      else if (edge.target === key) out.set(edge.source, edge);
    }
    return out;
  }

  degree(key: string): number {
    return this.neighborsOf(key).size;
  }

  /** The edge between two adjacent nodes, if any. */
  edgeBetween(a: string, b: string): UniverseEdge | undefined {
    for (const edge of this.edges.values()) {
      if (
        (edge.source === a && edge.target === b) ||
        (edge.source === b && edge.target === a)
      ) {
        return edge;
      }
    }
    return undefined;
  }

  /**
   * BFS shortest path over the FETCHED subgraph — the only connection oracle
   * the challenge mode may use. Returns node keys [a..b] or null.
   */
  bfsPath(a: string, b: string): string[] | null {
    if (!this.nodes.has(a) || !this.nodes.has(b)) return null;
    if (a === b) return [a];
    const prev = new Map<string, string>([[a, '']]);
    const queue = [a];
    while (queue.length) {
      const current = queue.shift() as string;
      for (const neighbor of this.neighborsOf(current).keys()) {
        if (prev.has(neighbor)) continue;
        prev.set(neighbor, current);
        if (neighbor === b) {
          const path: string[] = [];
          for (let k = b; k; k = prev.get(k) as string) path.unshift(k);
          return path;
        }
        queue.push(neighbor);
      }
    }
    return null;
  }

  /**
   * Next node roughly in direction (dx,dy) from `fromKey` — canvas keyboard
   * navigation. Prefers the farthest projection inside a ~60° cone; ties go to
   * the nearer node. Nodes without coordinates are ignored.
   */
  nextInDirection(fromKey: string, dx: number, dy: number): string | null {
    const from = this.nodes.get(fromKey);
    if (!from || (from.x === undefined && from.y === undefined)) return null;
    let best: string | null = null;
    let bestScore = -Infinity;
    for (const node of this.nodes.values()) {
      if (node.key === fromKey || node.x === undefined || node.y === undefined) continue;
      const vx = node.x - (from.x ?? 0);
      const vy = node.y - (from.y ?? 0);
      const len = Math.hypot(vx, vy);
      if (len < 1) continue;
      const cos = (vx * dx + vy * dy) / (len * Math.hypot(dx, dy));
      if (cos < 0.5) continue;
      // score: how far along the direction, nearer wins ties.
      const score = (vx * dx + vy * dy) / Math.hypot(dx, dy) - len * 0.001;
      if (score > bestScore) {
        bestScore = score;
        best = node.key;
      }
    }
    return best;
  }

  /**
   * Guided-journey step picker: the most connected not-yet-visited neighbor,
   * preferring factual edges over similarity ones.
   */
  pickJourneyStep(current: string, visited: ReadonlySet<string>): string | null {
    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [key, edge] of this.neighborsOf(current)) {
      if (visited.has(key)) continue;
      const score = this.degree(key) + (isFactualKind(edge.kind) ? 0.5 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = key;
      }
    }
    return best;
  }
}
