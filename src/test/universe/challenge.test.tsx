/**
 * "İki yapı arası bağlantı" challenge: setup validation, moves only along real
 * fetched edges, par from BFS, hint correctness, win path.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConnectionChallenge from '../../components/Universe/ConnectionChallenge';
import { UniverseGraph, edgeId, nodeKey } from '../../lib/universe/model';

function connectedGraph(): UniverseGraph {
  // m1 —cast— p5 —cast— m2 —cast— p6 —cast— m3
  const g = new UniverseGraph();
  g.add(
    [
      { key: nodeKey('movie', 1), kind: 'movie', id: 1, title: 'Film Bir' },
      { key: nodeKey('movie', 2), kind: 'movie', id: 2, title: 'Film İki' },
      { key: nodeKey('movie', 3), kind: 'movie', id: 3, title: 'Film Üç' },
      { key: nodeKey('person', 5), kind: 'person', id: 5, title: 'Kişi Beş' },
      { key: nodeKey('person', 6), kind: 'person', id: 6, title: 'Kişi Altı' },
    ],
    [
      { id: edgeId(nodeKey('movie', 1), 'cast', nodeKey('person', 5)), source: nodeKey('movie', 1), target: nodeKey('person', 5), kind: 'cast', label: 'Rol A' },
      { id: edgeId(nodeKey('movie', 2), 'cast', nodeKey('person', 5)), source: nodeKey('movie', 2), target: nodeKey('person', 5), kind: 'cast', label: 'Rol B' },
      { id: edgeId(nodeKey('movie', 2), 'cast', nodeKey('person', 6)), source: nodeKey('movie', 2), target: nodeKey('person', 6), kind: 'cast' },
      { id: edgeId(nodeKey('movie', 3), 'cast', nodeKey('person', 6)), source: nodeKey('movie', 3), target: nodeKey('person', 6), kind: 'cast' },
    ],
  );
  return g;
}

const selectOption = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

describe('ConnectionChallenge', () => {
  it('rejects a start when the pair has no path in the fetched subgraph', () => {
    const g = new UniverseGraph();
    g.add(
      [
        { key: nodeKey('movie', 1), kind: 'movie', id: 1, title: 'Yalnız A' },
        { key: nodeKey('movie', 2), kind: 'movie', id: 2, title: 'Yalnız B' },
      ],
      [],
    );
    render(
      <MemoryRouter>
        <ConnectionChallenge graph={g} version={0} onRequestFocus={vi.fn()} />
      </MemoryRouter>,
    );
    selectOption('A', 'movie:1');
    selectOption('B', 'movie:2');
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }));
    expect(screen.getByText(/henüz bağlantılı değil/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pes et' })).toBeNull();
  });

  it('plays a full game along real edges only, with par and hint from BFS', async () => {
    const g = connectedGraph();
    render(
      <MemoryRouter>
        <ConnectionChallenge graph={g} version={0} onRequestFocus={vi.fn()} />
      </MemoryRouter>,
    );

    selectOption('A', 'movie:1');
    selectOption('B', 'movie:3');
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }));

    // only real neighbors of the current node are offered as moves
    expect(screen.getByRole('button', { name: /Kişi Beş/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kişi Altı/ })).toBeNull();
    // par: m1→p5→m2→p6→m3 = 4 moves
    expect(screen.getByText(/en kısa: 4/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /İpucu/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/Kişi Beş/); // BFS next hop

    // walk the real path: p5 → m2 → p6 → m3 (each step offered only when adjacent)
    fireEvent.click(screen.getByRole('button', { name: /Kişi Beş/ }));
    expect(screen.getByText(/1 hamle/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Film İki/ }));
    fireEvent.click(screen.getByRole('button', { name: /Kişi Altı/ }));
    fireEvent.click(screen.getByRole('button', { name: /Film Üç/ }));
    await waitFor(() => expect(screen.getByText(/Başardın/i)).toBeInTheDocument());
    expect(screen.getByText(/4 hamlede/i)).toBeInTheDocument();
    // shortest path summary is listed with links to real detail pages
    expect(screen.getByRole('link', { name: 'Film Üç' })).toHaveAttribute('href', '/movie/3');
  });

  it('reveals the BFS path when the player gives up', () => {
    const g = connectedGraph();
    render(
      <MemoryRouter>
        <ConnectionChallenge graph={g} version={0} onRequestFocus={vi.fn()} />
      </MemoryRouter>,
    );
    selectOption('A', 'movie:1');
    selectOption('B', 'movie:3');
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pes et' }));
    expect(screen.getByText(/en kısa yol şuydu/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(5); // 5 path nodes
  });
});
