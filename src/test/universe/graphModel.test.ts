/**
 * Graph model correctness: edge typing, dedupe, session caps, BFS,
 * keyboard-navigation helper, journey step picker.
 */

import { describe, expect, it } from 'vitest';
import {
  CAPS,
  FACTUAL_KINDS,
  UniverseGraph,
  edgeId,
  isFactualKind,
  nodeKey,
  type UniverseEdge,
  type UniverseNode,
} from '../../lib/universe/model';
import {
  EXPANSION_LIMITS,
  buildMovieExpansion,
  buildPersonExpansion,
  buildTvExpansion,
} from '../../lib/universe/expand';

const movie = (id: number, title = `Film ${id}`): UniverseNode => ({
  key: nodeKey('movie', id),
  kind: 'movie',
  id,
  title,
});
const person = (id: number, title = `Kişi ${id}`): UniverseNode => ({
  key: nodeKey('person', id),
  kind: 'person',
  id,
  title,
});
const edge = (
  source: string,
  kind: UniverseEdge['kind'],
  target: string,
): UniverseEdge => ({ id: edgeId(source, kind, target), source, target, kind });

describe('edge typing honesty', () => {
  it('treats every credit/collection kind as factual and only similarity as non-factual', () => {
    for (const kind of ['cast', 'crew', 'director', 'creator', 'collection'] as const) {
      expect(isFactualKind(kind)).toBe(true);
      expect(FACTUAL_KINDS.has(kind)).toBe(true);
    }
    expect(isFactualKind('similarity')).toBe(false);
  });

  it('maps movie credits to cast/director/crew and recommendations to similarity only', () => {
    const expansion = buildMovieExpansion({
      id: 550,
      title: 'Fight Club',
      poster_path: '/abc.jpg',
      release_date: '1999-10-15',
      vote_average: 8.4,
      belongs_to_collection: null,
      credits: {
        cast: [{ id: 819, name: 'Edward Norton', profile_path: '/e.jpg', character: 'Anlatıcı' }],
        crew: [
          { id: 7467, name: 'David Fincher', job: 'Director', known_for_department: 'Directing' },
          { id: 123, name: 'Kesişen İğneciler', job: 'Production Design' }, // not notable → dropped
        ],
      },
      recommendations: {
        results: [{ id: 11, title: 'Önerilen', poster_path: '/r.jpg', release_date: '1999-01-01' }],
      },
    });

    const kinds = new Map(expansion.edges.map((e) => [e.kind, e]));
    expect(kinds.get('cast')?.target).toBe(nodeKey('person', 819));
    expect(kinds.get('cast')?.label).toBe('Anlatıcı');
    expect(kinds.get('director')?.target).toBe(nodeKey('person', 7467));
    expect(kinds.get('crew')).toBeUndefined();
    expect(kinds.get('similarity')?.target).toBe(nodeKey('movie', 11));
    expect(kinds.get('similarity')?.source).toBe(nodeKey('movie', 550));
    // self node carried so deep links can seed themselves
    expect(expansion.nodes).toContainEqual(expect.objectContaining({ key: nodeKey('movie', 550), year: '1999' }));
  });

  it('maps tv created_by to creator edges and collection membership when data exists', () => {
    const expansion = buildTvExpansion({
      id: 1399,
      name: 'Game of Thrones',
      first_air_date: '2011-04-17',
      created_by: [{ id: 19703, name: 'David Benioff' }],
      credits: { cast: [{ id: 2246, name: 'Emilia Clarke', character: 'Daenerys' }] },
      recommendations: { results: [{ id: 1398, name: 'Öneri Dizi' }] },
    });
    const kinds = new Set(expansion.edges.map((e) => e.kind));
    expect(kinds).toContain('creator');
    expect(kinds).toContain('cast');
    expect(kinds).toContain('similarity');
    expect(expansion.nodes.find((n) => n.key === nodeKey('tv', 1399))?.year).toBe('2011');

    const withCollection = buildMovieExpansion({
      id: 1891,
      belongs_to_collection: { id: 528, name: 'Koleksiyon' },
      credits: {},
      recommendations: { results: [] },
    });
    expect(withCollection.edges).toContainEqual(
      expect.objectContaining({
        kind: 'collection',
        source: nodeKey('movie', 1891),
        target: nodeKey('collection', 528),
      }),
    );
  });

  it('normalizes person-expansion edges so media is always the source (dedupes with movie expansion)', () => {
    const expansion = buildPersonExpansion({
      id: 7467,
      name: 'David Fincher',
      movie_credits: {
        cast: [],
        crew: [{ id: 550, title: 'Fight Club', job: 'Director', release_date: '1999-10-15' }],
      },
    });
    const [fincherEdge] = expansion.edges;
    expect(fincherEdge).toMatchObject({
      source: nodeKey('movie', 550),
      target: nodeKey('person', 7467),
      kind: 'director',
      label: 'Director',
    });
    // same relationship built from the movie side dedupes in the graph
    const graph = new UniverseGraph();
    const fromMovie = buildMovieExpansion({
      id: 550,
      credits: { crew: [{ id: 7467, name: 'David Fincher', job: 'Director' }] },
    });
    graph.add(fromMovie.nodes, fromMovie.edges);
    const before = graph.edges.size;
    const report = graph.add(expansion.nodes, expansion.edges);
    expect(report.addedEdges).toHaveLength(0);
    expect(graph.edges.size).toBe(before);
  });

  it('applies per-expansion limits (cast/crew/recs)', () => {
    const manyCast = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: `Oyuncu ${i}` }));
    const manyRecs = Array.from({ length: 30 }, (_, i) => ({ id: i + 500, title: `R ${i}` }));
    const expansion = buildMovieExpansion({
      id: 1,
      credits: {
        cast: manyCast,
        crew: manyCast.map((c) => ({ ...c, job: 'Director' })),
      },
      recommendations: { results: manyRecs },
    });
    const castEdges = expansion.edges.filter((e) => e.kind === 'cast');
    const directorEdges = expansion.edges.filter((e) => e.kind === 'director');
    const similarityEdges = expansion.edges.filter((e) => e.kind === 'similarity');
    expect(castEdges).toHaveLength(EXPANSION_LIMITS.cast);
    expect(directorEdges).toHaveLength(EXPANSION_LIMITS.crew);
    expect(similarityEdges).toHaveLength(EXPANSION_LIMITS.recs);
  });
});

describe('graph store: dedupe and session caps', () => {
  it('dedupes nodes and edges by key/id', () => {
    const g = new UniverseGraph();
    const first = g.add([movie(1), person(2)], [edge(nodeKey('movie', 1), 'cast', nodeKey('person', 2))]);
    const second = g.add([movie(1), person(2)], [edge(nodeKey('movie', 1), 'cast', nodeKey('person', 2))]);
    expect(first.addedNodes).toHaveLength(2);
    expect(second.addedNodes).toHaveLength(0);
    expect(second.addedEdges).toHaveLength(0);
    expect(g.nodes.size).toBe(2);
    expect(g.edges.size).toBe(1);
  });

  it('enforces the node cap', () => {
    const g = new UniverseGraph();
    const nodes = Array.from({ length: CAPS.nodes + 10 }, (_, i) => movie(i + 1));
    const report = g.add(nodes, []);
    expect(g.nodes.size).toBe(CAPS.nodes);
    expect(report.addedNodes).toHaveLength(CAPS.nodes);
  });

  it('enforces the edge cap and prefers factual edges over similarity under pressure', () => {
    const g = new UniverseGraph();
    g.add([movie(1), movie(2), person(3), person(4)], []);
    const factual = edge(nodeKey('movie', 1), 'cast', nodeKey('person', 3));
    const similarity = edge(nodeKey('movie', 1), 'similarity', nodeKey('movie', 2));
    // fill to cap-1, then offer [similarity, factual] (similarity listed first)
    const filler: UniverseEdge[] = [];
    for (let i = 0; i < CAPS.edges - 1; i++) {
      const a = nodeKey('person', 3);
      const b = nodeKey('person', 4);
      filler.push({ id: `f${i}`, source: a, target: b, kind: 'crew' });
    }
    g.add([], filler);
    expect(g.edges.size).toBe(CAPS.edges - 1);
    const report = g.add([person(3), person(4)], [similarity, factual]);
    expect(report.addedEdges.map((e) => e.kind)).toEqual(['cast']);
    expect(report.hitCap).toBe(true);
    expect(g.edges.size).toBe(CAPS.edges);
  });

  it('frees cap space on dismissal and accepts new nodes afterwards', () => {
    const g = new UniverseGraph();
    g.add(Array.from({ length: CAPS.nodes }, (_, i) => movie(i + 1)), []);
    expect(g.add([movie(9999)], []).addedNodes).toHaveLength(0);
    g.removeNode(nodeKey('movie', 1));
    // incident edges die with the node
    g.add([person(1)], [edge(nodeKey('movie', 2), 'cast', nodeKey('person', 1))]);
    g.removeNode(nodeKey('movie', 2));
    expect(g.edges.size).toBe(0);
    expect(g.add([movie(9999)], []).addedNodes).toHaveLength(1);
  });

  it('drops edges whose endpoints are missing', () => {
    const g = new UniverseGraph();
    const report = g.add([], [edge(nodeKey('movie', 1), 'cast', nodeKey('person', 2))]);
    expect(report.addedEdges).toHaveLength(0);
    expect(g.edges.size).toBe(0);
  });
});

describe('BFS connection oracle', () => {
  it('finds the shortest path and returns null when disconnected or unknown', () => {
    const g = new UniverseGraph();
    // m1 - p1 - m2 - p2 - m3, plus shortcut m1 - p2 (so shortest is 2 hops)
    g.add(
      [movie(1), movie(2), movie(3), person(1), person(2)],
      [
        edge(nodeKey('movie', 1), 'cast', nodeKey('person', 1)),
        edge(nodeKey('movie', 2), 'cast', nodeKey('person', 1)),
        edge(nodeKey('movie', 2), 'cast', nodeKey('person', 2)),
        edge(nodeKey('movie', 3), 'cast', nodeKey('person', 2)),
        edge(nodeKey('movie', 1), 'cast', nodeKey('person', 2)),
      ],
    );
    expect(g.bfsPath(nodeKey('movie', 1), nodeKey('movie', 3))).toEqual([
      nodeKey('movie', 1),
      nodeKey('person', 2),
      nodeKey('movie', 3),
    ]);
    g.add([movie(42)], []);
    expect(g.bfsPath(nodeKey('movie', 1), nodeKey('movie', 42))).toBeNull();
    expect(g.bfsPath(nodeKey('movie', 1), 'movie:does-not-exist')).toBeNull();
    expect(g.bfsPath(nodeKey('movie', 1), nodeKey('movie', 1))).toEqual([nodeKey('movie', 1)]);
  });
});

describe('keyboard navigation helper', () => {
  it('picks the nearest node in the arrow direction inside a ~60° cone', () => {
    const g = new UniverseGraph();
    g.add(
      [
        { ...movie(1), x: 0, y: 0 },
        { ...movie(2), x: 100, y: 0 }, // → right
        { ...movie(3), x: 0, y: -50 }, // ↑ up
        { ...movie(4), x: 95, y: 40 }, // right-up; outside the down cone, inside right's
        { ...person(5), x: -30, y: 10 },
      ],
      [],
    );
    expect(g.nextInDirection(nodeKey('movie', 1), 1, 0)).toBe(nodeKey('movie', 2));
    expect(g.nextInDirection(nodeKey('movie', 1), 0, -1)).toBe(nodeKey('movie', 3));
    expect(g.nextInDirection(nodeKey('movie', 1), 0, 1)).toBeNull(); // nothing straight below
    expect(g.nextInDirection(nodeKey('movie', 1), -1, 0)).toBe(nodeKey('person', 5));
  });
});

describe('guided-journey step picker', () => {
  it('picks the most connected unvisited neighbor, preferring factual edges', () => {
    const g = new UniverseGraph();
    g.add(
      [movie(1), person(2), person(3), movie(4)],
      [
        edge(nodeKey('movie', 1), 'cast', nodeKey('person', 2)),
        edge(nodeKey('movie', 1), 'similarity', nodeKey('person', 3)), // would win on degree tie
        edge(nodeKey('movie', 4), 'cast', nodeKey('person', 3)),
      ],
    );
    // person 3 has degree 2 (movie1+movie4) vs person 2 degree 1 → degree wins
    expect(g.pickJourneyStep(nodeKey('movie', 1), new Set())).toBe(nodeKey('person', 3));
    expect(g.pickJourneyStep(nodeKey('movie', 1), new Set([nodeKey('person', 3)]))).toBe(
      nodeKey('person', 2),
    );
    expect(g.pickJourneyStep(nodeKey('movie', 1), new Set([nodeKey('person', 3), nodeKey('person', 2)]))).toBeNull();
  });
});
