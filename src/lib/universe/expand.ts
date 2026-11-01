/**
 * Cinema Universe — TMDB raw payloads → graph nodes/edges.
 *
 * Pure mapping only; fetching lives in controller.ts. Shapes are minimal
 * structural views of the real RTK Query responses (`append_to_response`
 * bundles), so unit tests can pass tiny fixtures.
 *
 * Honesty: only cast/crew/director/creator/collection rows from TMDB credits
 * and `belongs_to_collection` become factual edges. `recommendations` results
 * become `similarity` edges — never cast/crew.
 */

import { edgeId, nodeKey, type UniverseEdge, type UniverseNode } from './model';

/** Per-expansion limits (fed through the session caps in model.ts). */
export const EXPANSION_LIMITS = { cast: 10, crew: 6, recs: 8 } as const;

/** Crew jobs that earn a graph edge (notable roles only, keeps caps sane). */
export const NOTABLE_CREW_JOBS = new Set([
  'Director',
  'Screenplay',
  'Writer',
  'Director of Photography',
  'Original Music Composer',
  'Editor',
]);

export interface Expansion {
  nodes: UniverseNode[];
  edges: UniverseEdge[];
}

// --- Minimal structural views of TMDB payloads -------------------------------

interface RawPersonLike {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string;
  character?: string;
  job?: string;
  department?: string;
}

interface RawMediaLike {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  known_for_department?: string;
}

interface RawCollection {
  id: number;
  name: string;
  poster_path?: string | null;
}

interface RawCredits {
  cast?: RawPersonLike[];
  crew?: RawPersonLike[];
}

interface RawRecPage {
  results?: RawMediaLike[];
}

export interface RawMovieFull {
  id: number;
  title?: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
  belongs_to_collection?: RawCollection | null;
  credits?: RawCredits;
  recommendations?: RawRecPage;
}

export interface RawTvFull {
  id: number;
  name?: string;
  poster_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  created_by?: RawPersonLike[];
  credits?: RawCredits;
  recommendations?: RawRecPage;
}

interface RawPersonCredit extends RawMediaLike {
  character?: string;
  job?: string;
}

export interface RawPersonFull {
  id: number;
  name?: string;
  profile_path?: string | null;
  known_for_department?: string;
  movie_credits?: { cast?: RawPersonCredit[]; crew?: RawPersonCredit[] };
  tv_credits?: { cast?: RawPersonCredit[]; crew?: RawPersonCredit[] };
}

// --- helpers ------------------------------------------------------------------

function year(date?: string): string | undefined {
  return date && date.length >= 4 ? date.slice(0, 4) : undefined;
}

function personNode(p: RawPersonLike): UniverseNode {
  return {
    key: nodeKey('person', p.id),
    kind: 'person',
    id: p.id,
    title: p.name,
    posterPath: p.profile_path ?? null,
    department: p.known_for_department,
  };
}

function personEdge(media: UniverseNode, p: RawPersonLike, kind: 'cast' | 'crew' | 'director' | 'creator'): UniverseEdge {
  return {
    id: edgeId(media.key, kind, nodeKey('person', p.id)),
    source: media.key,
    target: nodeKey('person', p.id),
    kind,
    label: kind === 'cast' ? p.character : p.job,
  };
}

/** Cast + notable crew (Director → 'director', others → 'crew'). */
function creditNodesAndEdges(media: UniverseNode, credits: RawCredits | undefined): Expansion {
  const nodes: UniverseNode[] = [];
  const edges: UniverseEdge[] = [];
  const seen = new Set<string>();

  for (const member of (credits?.cast ?? []).slice(0, EXPANSION_LIMITS.cast)) {
    if (!member || !member.id || !member.name) continue;
    const key = nodeKey('person', member.id);
    if (!seen.has(key)) {
      seen.add(key);
      nodes.push(personNode(member));
    }
    edges.push(personEdge(media, member, 'cast'));
  }

  let crewCount = 0;
  const crewSeen = new Set<string>();
  for (const member of credits?.crew ?? []) {
    if (crewCount >= EXPANSION_LIMITS.crew) break;
    if (!member || !member.id || !member.name) continue;
    if (!NOTABLE_CREW_JOBS.has(member.job ?? '')) continue;
    const key = nodeKey('person', member.id);
    if (crewSeen.has(key)) continue;
    crewSeen.add(key);
    nodes.push(personNode(member));
    edges.push(personEdge(media, member, member.job === 'Director' ? 'director' : 'crew'));
    crewCount++;
  }
  return { nodes, edges };
}

function similarityEdges(
  media: UniverseNode,
  recs: RawRecPage | undefined,
  kindOf: (item: RawMediaLike) => UniverseNode,
): Expansion {
  const nodes: UniverseNode[] = [];
  const edges: UniverseEdge[] = [];
  for (const item of (recs?.results ?? []).slice(0, EXPANSION_LIMITS.recs)) {
    if (!item || !item.id) continue;
    const node = kindOf(item);
    if (node.key === media.key) continue;
    nodes.push(node);
    edges.push({
      id: edgeId(media.key, 'similarity', node.key),
      source: media.key,
      target: node.key,
      kind: 'similarity',
      label: 'benzer',
    });
  }
  return { nodes, edges };
}

function merge(...parts: Expansion[]): Expansion {
  return {
    nodes: parts.flatMap((p) => p.nodes),
    edges: parts.flatMap((p) => p.edges),
  };
}

// --- builders -----------------------------------------------------------------

export function buildMovieExpansion(detail: RawMovieFull): Expansion {
  const movie: UniverseNode = {
    key: nodeKey('movie', detail.id),
    kind: 'movie',
    id: detail.id,
    title: detail.title ?? `Film #${detail.id}`,
    posterPath: detail.poster_path ?? null,
    year: year(detail.release_date),
    voteAverage: detail.vote_average,
  };
  const parts: Expansion[] = [{ nodes: [movie], edges: [] }, creditNodesAndEdges(movie, detail.credits)];
  if (detail.belongs_to_collection?.id) {
    const collection = detail.belongs_to_collection;
    const colNode: UniverseNode = {
      key: nodeKey('collection', collection.id),
      kind: 'collection',
      id: collection.id,
      title: collection.name,
      posterPath: collection.poster_path ?? null,
    };
    parts.push({
      nodes: [colNode],
      edges: [
        {
          id: edgeId(movie.key, 'collection', colNode.key),
          source: movie.key,
          target: colNode.key,
          kind: 'collection',
          label: 'üye',
        },
      ],
    });
  }
  parts.push(
    similarityEdges(movie, detail.recommendations, (item) => ({
      key: nodeKey('movie', item.id),
      kind: 'movie',
      id: item.id,
      title: item.title ?? `Film #${item.id}`,
      posterPath: item.poster_path ?? null,
      year: year(item.release_date),
      voteAverage: item.vote_average,
    })),
  );
  return merge(...parts);
}

export function buildTvExpansion(detail: RawTvFull): Expansion {
  const show: UniverseNode = {
    key: nodeKey('tv', detail.id),
    kind: 'tv',
    id: detail.id,
    title: detail.name ?? `Dizi #${detail.id}`,
    posterPath: detail.poster_path ?? null,
    year: year(detail.first_air_date),
    voteAverage: detail.vote_average,
  };
  const parts: Expansion[] = [
    { nodes: [show], edges: [] },
    creditNodesAndEdges(show, detail.credits),
  ];
  for (const creator of (detail.created_by ?? []).slice(0, EXPANSION_LIMITS.crew)) {
    if (!creator || !creator.id || !creator.name) continue;
    parts.push({
      nodes: [personNode(creator)],
      edges: [personEdge(show, creator, 'creator')],
    });
  }
  parts.push(
    similarityEdges(show, detail.recommendations, (item) => ({
      key: nodeKey('tv', item.id),
      kind: 'tv',
      id: item.id,
      title: item.name ?? `Dizi #${item.id}`,
      posterPath: item.poster_path ?? null,
      year: year(item.first_air_date),
      voteAverage: item.vote_average,
    })),
  );
  return merge(...parts);
}

export function buildPersonExpansion(detail: RawPersonFull): Expansion {
  const person: UniverseNode = {
    key: nodeKey('person', detail.id),
    kind: 'person',
    id: detail.id,
    title: detail.name ?? `Kişi #${detail.id}`,
    posterPath: detail.profile_path ?? null,
    department: detail.known_for_department,
  };

  const nodes: UniverseNode[] = [person];
  const edges: UniverseEdge[] = [];
  const seen = new Set<string>([person.key]);

  /** media credit row → node + normalized edge (media is always the source). */
  const addCredit = (item: RawPersonCredit, mediaKind: 'movie' | 'tv', kind: 'cast' | 'crew' | 'director') => {
    if (!item || !item.id) return;
    const key = nodeKey(mediaKind, item.id);
    if (!seen.has(key)) {
      seen.add(key);
      nodes.push({
        key,
        kind: mediaKind,
        id: item.id,
        title:
          (mediaKind === 'movie' ? item.title : item.name) ??
          (mediaKind === 'movie' ? `Film #${item.id}` : `Dizi #${item.id}`),
        posterPath: item.poster_path ?? null,
        year: year(mediaKind === 'movie' ? item.release_date : item.first_air_date),
        voteAverage: item.vote_average,
      });
    }
    edges.push({
      id: edgeId(key, kind, person.key),
      source: key,
      target: person.key,
      kind,
      label: kind === 'cast' ? item.character : item.job,
    });
  };

  (detail.movie_credits?.cast ?? []).slice(0, EXPANSION_LIMITS.cast).forEach((c) => addCredit(c, 'movie', 'cast'));
  (detail.tv_credits?.cast ?? []).slice(0, EXPANSION_LIMITS.cast).forEach((c) => addCredit(c, 'tv', 'cast'));
  (detail.movie_credits?.crew ?? [])
    .filter((c) => c?.job === 'Director')
    .slice(0, EXPANSION_LIMITS.crew)
    .forEach((c) => addCredit(c, 'movie', 'director'));
  (detail.tv_credits?.crew ?? [])
    .filter((c) => NOTABLE_CREW_JOBS.has(c?.job ?? ''))
    .slice(0, EXPANSION_LIMITS.crew)
    .forEach((c) => addCredit(c, 'tv', c.job === 'Director' ? 'director' : 'crew'));

  return { nodes, edges };
}
