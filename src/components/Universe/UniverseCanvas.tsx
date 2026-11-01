/**
 * Cinema Universe — canvas graph renderer + interaction surface.
 *
 * d3-force simulation only (no heavier graphics stack, per brief). Handles:
 * zoom (wheel + pinch), pan (drag), click select, hover highlight, keyboard
 * navigation (arrows/enter/escape/+/-), focus/recenter. Defensive about jsdom:
 * with a null 2d context it still renders the focusable a11y wrapper and runs
 * the keyboard logic (see src/test/universe/navigation.test.tsx).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { UniverseEdge, UniverseGraph, UniverseNode } from '../../lib/universe/model';
import { NODE_KIND_LABELS } from '../../lib/universe/model';
import { TMDB_CONFIG } from '../../utils/constants';

export interface UniverseCanvasProps {
  graph: UniverseGraph;
  /** Bump after graph mutations so the simulation re-syncs. */
  version: number;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onExpand: (key: string) => void;
  reducedMotion: boolean;
  /** Center on this node; change `nonce` to repeat for the same node. */
  focusRequest: { key: string; nonce: number } | null;
}

type SimNode = UniverseNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<SimNode>;

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

function radiusOf(node: UniverseNode): number {
  switch (node.kind) {
    case 'collection':
      return 11;
    case 'movie':
    case 'tv':
      return 9;
    default:
      return 7;
  }
}

/** Canvas palette read from the Cinematic Atlas CSS variables once per mount. */
function useThemeColors() {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.document) {
      return {};
    }
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    return {
      bg: read('--color-surface-void', '#0a0a0f'),
      textPrimary: read('--color-text-primary', '#f5f3ee'),
      textSecondary: read('--color-text-secondary', '#a8a59c'),
      textMuted: read('--color-text-muted', '#8a877f'),
      accent: read('--color-accent', '#e8b54d'),
      raised: read('--color-surface-raised', '#16161f'),
      success: read('--color-success', '#4ade80'),
      line: read('--color-line-strong', 'rgba(245,243,238,0.16)'),
    };
  }, []);
}

export default function UniverseCanvas(props: UniverseCanvasProps) {
  const { graph, version, selectedKey, onSelect, onExpand, reducedMotion, focusRequest } = props;
  const colors = useThemeColors();

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const transformRef = useRef({ k: 1, x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const hoverRef = useRef<string | null>(null);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const rafRef = useRef(0);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const pinchRef = useRef<{ dist: number } | null>(null);
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const selectedRef = useRef(selectedKey);
  selectedRef.current = selectedKey;
  const [hoverTitle, setHoverTitle] = useState<string | null>(null);

  // --- draw ----------------------------------------------------------------

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      draw();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return; // jsdom: logic-only mode
    const { w, h } = sizeRef.current;
    const { k, x: tx, y: ty } = transformRef.current;
    const selected = selectedRef.current;
    const hover = hoverRef.current;
    const g = graphRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = colors.bg ?? '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    const highlight = hover ?? selected;
    const neighbors = highlight ? new Set(g.neighborsOf(highlight).keys()) : null;

    const toScreen = (nx: number, ny: number): [number, number] => [nx * k + tx, ny * k + ty];

    // edges
    for (const edge of g.edges.values()) {
      const a = g.nodes.get(edge.source);
      const b = g.nodes.get(edge.target);
      if (!a || !b || a.x === undefined || b.x === undefined) continue;
      const dim = highlight ? !(highlight === edge.source || highlight === edge.target) : false;
      ctx.globalAlpha = dim ? 0.15 : 0.8;
      ctx.strokeStyle =
        highlight && !dim ? (colors.accent ?? '#e8b54d') : (colors.textMuted ?? '#8a877f');
      ctx.lineWidth = edge.kind === 'similarity' ? 1 : 1.5;
      ctx.setLineDash(edge.kind === 'similarity' ? [4, 4] : []);
      const [ax, ay] = toScreen(a.x, a.y ?? 0);
      const [bx, by] = toScreen(b.x, b.y ?? 0);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // nodes
    for (const node of g.nodes.values()) {
      if (node.x === undefined || node.y === undefined) continue;
      const [sx, sy] = toScreen(node.x, node.y);
      const r = radiusOf(node) * Math.max(k, 0.6) + (node.key === selected ? 3 : 0);
      const dim = highlight && node.key !== highlight && !neighbors?.has(node.key);

      ctx.globalAlpha = dim ? 0.25 : 1;

      // poster image or filled disc
      const img = imagesRef.current.get(node.key);
      const poster = img?.complete && img.naturalWidth > 0 ? img : null;
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (poster) {
        ctx.drawImage(poster, sx - r, sy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = colors.raised ?? '#16161f';
        ctx.fill();
      }
      ctx.restore();

      // ring by kind; collection = dashed, similarity hub never (edges carry it)
      ctx.strokeStyle =
        node.key === selected || node.key === hover
          ? (colors.accent ?? '#e8b54d')
          : node.kind === 'movie'
            ? (colors.accent ?? '#e8b54d')
            : node.kind === 'tv'
              ? (colors.success ?? '#4ade80')
              : (colors.textSecondary ?? '#a8a59c');
      ctx.lineWidth = node.key === selected || node.key === hover ? 2.5 : 1.25;
      if (node.kind === 'collection') ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!poster) {
        ctx.fillStyle = colors.textPrimary ?? '#f5f3ee';
        ctx.font = `${Math.max(r * 0.9, 8)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.title.charAt(0).toUpperCase(), sx, sy);
      }

      // labels when zoomed in, or hovered/selected
      if (k >= 0.9 || node.key === highlight) {
        ctx.globalAlpha = dim ? 0.3 : 0.95;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const text = node.title.length > 22 ? `${node.title.slice(0, 21)}…` : node.title;
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(10,10,15,0.75)';
        ctx.fillRect(sx - tw / 2 - 3, sy + r + 3, tw + 6, 14);
        ctx.fillStyle = node.key === highlight ? (colors.accent ?? '#e8b54d') : (colors.textPrimary ?? '#f5f3ee');
        ctx.fillText(text, sx, sy + r + 5);
      }
      ctx.globalAlpha = 1;
    }
  }, [colors]);

  // --- simulation sync -----------------------------------------------------

  useEffect(() => {
    const simNodes = simNodesRef.current;
    const byKey = new Map(simNodes.map((n) => [n.key, n]));
    // prune removed
    for (let i = simNodes.length - 1; i >= 0; i--) {
      if (!graph.nodes.has(simNodes[i].key)) simNodes.splice(i, 1);
    }
    // add new next to a connected node (or center) for a stable start
    for (const node of graph.nodes.values()) {
      if (byKey.has(node.key)) continue;
      const anchorKey = graph
        .neighborsOf(node.key)
        .keys()
        .next().value;
      const anchor = anchorKey ? simNodes.find((n) => n.key === anchorKey) : undefined;
      const fresh = node as SimNode;
      if (fresh.x === undefined || fresh.y === undefined) {
        // seed near a connected node (or center) — never clobber preset coords
        const angle = Math.random() * Math.PI * 2;
        fresh.x = (anchor?.x ?? 0) + Math.cos(angle) * 40;
        fresh.y = (anchor?.y ?? 0) + Math.sin(angle) * 40;
      }
      simNodes.push(fresh);
      // lazy poster preload
      if (node.posterPath && !imagesRef.current.has(node.key) && typeof Image !== 'undefined') {
        const img = new Image();
        img.onload = scheduleDraw;
        img.src = `${TMDB_CONFIG.IMAGE_BASE_URL}/w92${node.posterPath}`;
        imagesRef.current.set(node.key, img);
      }
    }

    const links: SimLink[] = [...graph.edges.values()].map((e: UniverseEdge) => ({
      source: e.source,
      target: e.target,
    }));

    if (!simRef.current) {
      simRef.current = forceSimulation<SimNode, SimLink>(simNodes)
        .force(
          'link',
          forceLink<SimNode, SimLink>(links)
            .id((n) => n.key)
            .distance(60)
            .strength(0.35),
        )
        .force('charge', forceManyBody<SimNode>().strength(-160))
        .force('collide', forceCollide<SimNode>((n) => radiusOf(n) + 6).iterations(2))
        .force('x', forceX<SimNode>(0).strength(0.06))
        .force('y', forceY<SimNode>(0).strength(0.06));
      simRef.current.on('tick', scheduleDraw);
    } else {
      const sim = simRef.current;
      sim.nodes(simNodes); // re-initializes forces, incl. link endpoints
      (sim.force('link') as ReturnType<typeof forceLink<SimNode, SimLink>>).links(links);
      sim.alpha(0.6).restart();
    }
    if (reducedMotion) {
      simRef.current.stop();
      simRef.current.tick(120); // settle instantly, no animation
    }
    scheduleDraw();
    return undefined;
  }, [graph, version, reducedMotion, scheduleDraw]);

  // --- resize ---------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const apply = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w: rect.width, h: rect.height };
      // first sizing: put the world origin (graph center) at the canvas center
      const t = transformRef.current;
      if (t.x === 0 && t.y === 0 && rect.width > 0) {
        transformRef.current = { k: t.k, x: rect.width / 2, y: rect.height / 2 };
      }
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      ctx?.scale(dpr, dpr);
      scheduleDraw();
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [scheduleDraw]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      simRef.current?.stop();
    };
  }, []);

  // --- redraw on selection/hover change ------------------------------------

  useEffect(() => {
    scheduleDraw();
  }, [selectedKey, hoverTitle, scheduleDraw]);

  // --- focus/recenter -------------------------------------------------------

  useEffect(() => {
    if (!focusRequest) return;
    const node = graph.nodes.get(focusRequest.key);
    if (!node || node.x === undefined || node.y === undefined) return;
    const { w, h } = sizeRef.current;
    const target = { k: transformRef.current.k, x: w / 2 - node.x * transformRef.current.k, y: h / 2 - node.y * transformRef.current.k };
    if (reducedMotion) {
      transformRef.current = target;
      scheduleDraw();
      return;
    }
    const start = { ...transformRef.current };
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / 350, 1);
      const e = 1 - (1 - p) ** 3;
      transformRef.current = {
        k: start.k,
        x: start.x + (target.x - start.x) * e,
        y: start.y + (target.y - start.y) * e,
      };
      scheduleDraw();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [focusRequest, graph, reducedMotion, scheduleDraw]);

  // --- pointer input --------------------------------------------------------

  const toWorld = (clientX: number, clientY: number): [number, number] => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const { k, x, y } = transformRef.current;
    const sx = clientX - (rect?.left ?? 0);
    const sy = clientY - (rect?.top ?? 0);
    return [(sx - x) / k, (sy - y) / k];
  };

  const hitTest = (clientX: number, clientY: number): string | null => {
    const [wx, wy] = toWorld(clientX, clientY);
    let best: string | null = null;
    let bestDist = Infinity;
    for (const node of graph.nodes.values()) {
      if (node.x === undefined || node.y === undefined) continue;
      const d = Math.hypot(node.x - wx, node.y - wy);
      if (d <= radiusOf(node) + 8 && d < bestDist) {
        bestDist = d;
        best = node.key;
      }
    }
    return best;
  };

  const zoomBy = (factor: number, cx: number, cy: number) => {
    const t = transformRef.current;
    const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.k * factor));
    const rect = canvasRef.current?.getBoundingClientRect();
    const px = cx - (rect?.left ?? 0);
    const py = cy - (rect?.top ?? 0);
    transformRef.current = {
      k,
      x: px - ((px - t.x) / t.k) * k,
      y: py - ((py - t.y) / t.k) * k,
    };
    scheduleDraw();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // synthetic/lost pointers carry no active id — capture is best-effort
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
      dragRef.current = null;
    } else {
      dragRef.current = { startX: e.clientX, startY: e.clientY, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pointers = pointersRef.current;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2 && pinchRef.current) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchRef.current.dist > 0) {
        zoomBy(dist / pinchRef.current.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      pinchRef.current = { dist };
      return;
    }

    const drag = dragRef.current;
    if (drag) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 5) drag.moved = true;
      const t = transformRef.current;
      transformRef.current = { k: t.k, x: t.x + e.movementX, y: t.y + e.movementY };
      scheduleDraw();
      return;
    }

    const hit = hitTest(e.clientX, e.clientY);
    if (hit !== hoverRef.current) {
      hoverRef.current = hit;
      setHoverTitle(hit ? (graph.nodes.get(hit)?.title ?? null) : null);
      scheduleDraw();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    dragRef.current = null;
    if (drag && !drag.moved) {
      onSelect(hitTest(e.clientX, e.clientY)); // click or tap → select (mobile has no hover)
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- keyboard navigation ---------------------------------------------------

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dirs: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const from = selectedKey ?? graph.nodeArray()[0]?.key ?? null;
    if (dirs[e.key] && from) {
      e.preventDefault();
      const next = graph.nextInDirection(from, dirs[e.key][0], dirs[e.key][1]);
      if (next) onSelect(next);
    } else if ((e.key === 'Enter' || e.key === ' ') && selectedKey) {
      e.preventDefault();
      onExpand(selectedKey);
    } else if (e.key === 'Escape') {
      onSelect(null);
    } else if (e.key === '+' || e.key === '=') {
      const { w, h } = sizeRef.current;
      zoomBy(1.25, w / 2, h / 2);
    } else if (e.key === '-') {
      const { w, h } = sizeRef.current;
      zoomBy(0.8, w / 2, h / 2);
    }
  };

  const selectedNode = selectedKey ? graph.nodes.get(selectedKey) : undefined;

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden rounded-lg border border-line bg-surface-void"
    >
      <div
        role="application"
        aria-label="Sinema evreni bağlantı grafiği. Ok tuşlarıyla düğümler arası gezinin, Enter ile komşuları getirin, Escape ile seçimi kaldırın."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="h-full w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        data-testid="universe-canvas-surface"
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => {
            const hit = hitTest(e.clientX, e.clientY);
            if (hit) onExpand(hit);
          }}
          aria-hidden="true"
        />
      </div>
      <div aria-live="polite" className="sr-only" data-testid="universe-live-region">
        {selectedNode
          ? `Seçili: ${NODE_KIND_LABELS[selectedNode.kind]} ${selectedNode.title}, ${graph.degree(selectedNode.key)} bağlantı`
          : 'Seçim yok'}
      </div>
      {hoverTitle && (
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-surface-overlay px-2 py-1 text-xs text-secondary">
          {hoverTitle}
        </div>
      )}
    </div>
  );
}
