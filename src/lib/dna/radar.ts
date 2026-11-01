/**
 * Radar geometrisi — SVG bileşeni ve canvas paylaşım kartı ortak kullanır.
 * Değerler 0–1; açı eksen sayısına eşit bölünür, 0 değer merkezde bir nokta.
 */
export interface RadarPoint {
  x: number;
  y: number;
}

/** `values.length >= 3` için geçerli poligon köşeleri. */
export function radarPoints(values: number[], cx: number, cy: number, radius: number, startAngle = -Math.PI / 2): RadarPoint[] {
  const n = values.length;
  if (n === 0) return [];
  return values.map((v, i) => {
    const angle = startAngle + (2 * Math.PI * i) / n;
    const r = radius * Math.min(Math.max(v, 0), 1);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export function toPathPolyline(points: RadarPoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}
