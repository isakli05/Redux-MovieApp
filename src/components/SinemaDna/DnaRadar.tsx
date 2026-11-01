/**
 * DnaRadar — tür meyilleri radarı. Saf SVG (grafik bağımlılığı yok).
 * Erişilebilirlik: şekil role="img" + özet aria-label; değerler ayrıca
 * tablo olarak da listelenir (ekran okuyucu / düşük görüş için).
 */
import { genreLabel } from '../../lib/dna/genres';
import type { DimensionEntry } from '../../lib/dna/profile';
import { radarPoints } from '../../lib/dna/radar';

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 118;

export function confidenceBadgeText(confidence: string): string {
  return `güven: ${confidence}`;
}

export default function DnaRadar({ dims }: { dims: DimensionEntry[] }) {
  const shown = dims.filter((d) => d.evidenceCount > 0).slice(0, 6);
  if (shown.length < 3) {
    return (
      <p className="text-sm text-secondary" data-testid="dna-radar-empty">
        Radar için en az üç kanıtlı tür gerekiyor — birkaç karşılaştırma daha yeter.
      </p>
    );
  }
  const values = shown.map((d) => d.affinity);
  const rings = [0.25, 0.5, 0.75, 1];
  const summary = shown.map((d) => `${d.label} %${Math.round(d.affinity * 100)}`).join(', ');

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-72 w-72 shrink-0"
        role="img"
        aria-label={`Tür meyilleri radarı: ${summary}`}
        data-testid="dna-radar"
      >
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={radarPoints(values.map(() => ring), CX, CY, R)
              .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={ring === 1 ? 1.5 : 1}
            strokeDasharray={ring === 0.5 ? '4 4' : undefined}
          />
        ))}
        {radarPoints(values, CX, CY, R).map((p, i) => (
          <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="var(--color-line)" strokeWidth="1" />
        ))}
        <polygon
          points={radarPoints(values, CX, CY, R)
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ')}
          fill="var(--color-accent)"
          fillOpacity="0.18"
          stroke="var(--color-accent)"
          strokeWidth="2"
          data-testid="dna-radar-poly"
        />
        {shown.map((d, i) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / values.length;
          const lx = CX + (R + 40) * Math.cos(angle);
          const ly = CY + (R + 40) * Math.sin(angle);
          return (
            <text
              key={d.key}
              x={lx}
              y={ly}
              textAnchor={Math.abs(lx - CX) < 12 ? 'middle' : lx > CX ? 'start' : 'end'}
              dominantBaseline="middle"
              className="fill-current text-[11px] text-secondary"
            >
              {genreLabel(d.key)}
            </text>
          );
        })}
      </svg>
      <ul className="w-full space-y-2" aria-label="Tür meyilleri ve kanıtları">
        {shown.map((d) => (
          <li key={d.key} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-primary">{genreLabel(d.key)}</span>
              <span className="text-muted">%{Math.round(d.affinity * 100)}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(d.affinity * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {d.evidenceText} · {confidenceBadgeText(d.confidence)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
