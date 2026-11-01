/**
 * Accessibility: keyboard navigation on the canvas surface, the DOM list-view
 * alternative (same data), and the delivered UniverseLinkButton deep link.
 * jsdom has no 2d canvas — UniverseCanvas intentionally runs logic-only there.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UniverseCanvas from '../../components/Universe/UniverseCanvas';
import UniverseListView from '../../components/Universe/UniverseListView';
import UniverseLinkButton from '../../components/Universe/UniverseLinkButton';
import { UniverseGraph, edgeId, nodeKey } from '../../lib/universe/model';

function graphWithPositions(): UniverseGraph {
  const g = new UniverseGraph();
  g.add(
    [
      { key: nodeKey('movie', 1), kind: 'movie', id: 1, title: 'Merkez Film', x: 0, y: 0 },
      { key: nodeKey('movie', 2), kind: 'movie', id: 2, title: 'Sağdaki Film', x: 120, y: 5 },
      { key: nodeKey('person', 3), kind: 'person', id: 3, title: 'Yukarıdaki Kişi', x: 0, y: -80 },
    ],
    [
      {
        id: edgeId(nodeKey('movie', 1), 'cast', nodeKey('person', 3)),
        source: nodeKey('movie', 1),
        target: nodeKey('person', 3),
        kind: 'cast',
      },
    ],
  );
  return g;
}

describe('UniverseCanvas keyboard navigation + a11y', () => {
  it('exposes a focusable application surface with instructions', () => {
    const g = graphWithPositions();
    render(
      <UniverseCanvas
        graph={g}
        version={0}
        selectedKey={null}
        onSelect={vi.fn()}
        onExpand={vi.fn()}
        reducedMotion={false}
        focusRequest={null}
      />,
    );
    const surface = screen.getByTestId('universe-canvas-surface');
    expect(surface).toHaveAttribute('role', 'application');
    expect(surface).toHaveAttribute('tabIndex', '0');
    expect(surface).toHaveAccessibleName(/bağlantı grafiği/i);
    expect(surface.getAttribute('aria-label')).toContain('Ok tuşları');
  });

  it('ArrowRight/ArrowUp move the selection and Enter expands the selected node', () => {
    const g = graphWithPositions();
    const onSelect = vi.fn();
    const onExpand = vi.fn();
    render(
      <UniverseCanvas
        graph={g}
        version={0}
        selectedKey={nodeKey('movie', 1)}
        onSelect={onSelect}
        onExpand={onExpand}
        reducedMotion={false}
        focusRequest={null}
      />,
    );
    const surface = screen.getByTestId('universe-canvas-surface');
    surface.focus();
    expect(surface).toHaveFocus();

    fireEvent.keyDown(surface, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalledWith(nodeKey('movie', 2));

    fireEvent.keyDown(surface, { key: 'ArrowUp' });
    expect(onSelect).toHaveBeenCalledWith(nodeKey('person', 3));

    fireEvent.keyDown(surface, { key: 'Enter' });
    expect(onExpand).toHaveBeenCalledWith(nodeKey('movie', 1));

    fireEvent.keyDown(surface, { key: 'Escape' });
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('announces the selection in a polite live region', () => {
    const g = graphWithPositions();
    const { rerender } = render(
      <UniverseCanvas
        graph={g}
        version={0}
        selectedKey={nodeKey('movie', 1)}
        onSelect={vi.fn()}
        onExpand={vi.fn()}
        reducedMotion={false}
        focusRequest={null}
      />,
    );
    expect(screen.getByTestId('universe-live-region')).toHaveTextContent('Seçili: Film Merkez Film');
    rerender(
      <UniverseCanvas
        graph={g}
        version={1}
        selectedKey={null}
        onSelect={vi.fn()}
        onExpand={vi.fn()}
        reducedMotion={false}
        focusRequest={null}
      />,
    );
    expect(screen.getByTestId('universe-live-region')).toHaveTextContent('Seçim yok');
  });
});

describe('UniverseListView (accessible alternative)', () => {
  it('renders the same graph data as a labeled table with working links', () => {
    const g = graphWithPositions();
    render(
      <MemoryRouter>
        <UniverseListView graph={g} version={0} selectedKey={nodeKey('movie', 1)} onSelect={vi.fn()} />
      </MemoryRouter>,
    );
    const table = screen.getByTestId('universe-list-table');
    // caption announces the table's purpose to screen readers
    expect(table.querySelector('caption')).toHaveTextContent(/bağlantı sayısına göre/i);
    expect(screen.getByRole('button', { name: /Merkez Film/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Sağdaki Film/ })).toHaveAttribute('aria-pressed', 'false');
    const links = screen.getAllByRole('link', { name: 'Aç' });
    expect(links.map((l) => l.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/movie/1', '/movie/2', '/person/3']),
    );
  });
});

describe('UniverseLinkButton', () => {
  it('deep-links a MediaRef to /evren with the canonical focus key', () => {
    render(
      <MemoryRouter>
        <UniverseLinkButton media={{ kind: 'tv', id: 1399, title: 'Game of Thrones' }} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Evrende gör/ });
    expect(link).toHaveAttribute('href', '/evren?focus=tv:1399');
  });
});
