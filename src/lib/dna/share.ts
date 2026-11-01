/**
 * Paylaşılabilir tat kartı — istemci tarafında üretilir (ağ yok, veri dışarı gitmez).
 * Metin her ortamda; görsel canvas ile (radar + tür çubukları), desteklenmiyorsa null.
 */
import type { DnaProfile } from './profile';
import { radarPoints, toPathPolyline } from './radar';

const TRkind = { cast: 'oyuncu', director: 'yönetmen' } as const;

/** Türkçe, kanıt bildiren paylaşım metni. Yalnız kanıtlı satırlar yer alır. */
export function shareText(profile: DnaProfile): string {
  const lines: string[] = ['🎞 Sinema DNA’m — LMDB'];
  const top = profile.genreDims.filter((d) => d.evidenceCount > 0).slice(0, 3);
  if (top.length) {
    lines.push(`Türlerim: ${top.map((d) => `${d.label} %${Math.round(d.affinity * 100)}`).join(', ')}`);
  }
  const era = profile.eraDims.find((d) => d.evidenceCount > 0 && d.affinity >= 0.5);
  if (era) lines.push(`Dönem: ${era.label} ağırlıklı`);
  if (profile.runtime.mean && profile.runtime.tendency) {
    lines.push(`Süre eğilimi: ${profile.runtime.tendency} filmler (ort. ${profile.runtime.mean} dk)`);
  }
  const person = profile.people[0];
  if (person && person.evidenceCount >= 2) {
    lines.push(`En çok dönen isim: ${person.name} (${TRkind[person.role]})`);
  }
  lines.push(`Güven: ${profile.overallConfidence} — ${profile.overallEvidenceText}`);
  lines.push('lmdb · /dna');
  return lines.join('\n');
}

/** 1000×640 PNG; canvas desteklenmiyorsa (jsdom vb.) null döner. */
export async function renderShareCard(profile: DnaProfile): Promise<Blob | null> {
  const dims = profile.genreDims.filter((d) => d.evidenceCount > 0).slice(0, 6);
  if (dims.length < 3) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string): string => css.getPropertyValue(name).trim() || fallback;
    const bg = token('--color-surface-void', '#0b0b12');
    const accent = token('--color-accent', '#d4a853');
    const primary = token('--color-text-primary', '#f5f1e8');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(24.5, 24.5, canvas.width - 49, canvas.height - 49);
    ctx.globalAlpha = 1;

    ctx.fillStyle = primary;
    ctx.font = '600 44px "Fraunces Variable", Georgia, serif';
    ctx.fillText('Sinema DNA’m', 56, 92);
    ctx.font = '400 20px "Inter Variable", system-ui, sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(`Güven: ${profile.overallConfidence} — ${profile.overallEvidenceText}`, 56, 126);

    // Sol: radar. Sağ: tür çubukları.
    const cx = 280;
    const cy = 400;
    const r = 170;
    const values = dims.map((d) => d.affinity);
    ctx.strokeStyle = 'rgba(245, 241, 232, 0.25)';
    for (const ring of [0.25, 0.5, 0.75, 1]) {
      const pts = radarPoints(values.map(() => ring), cx, cy, r);
      ctx.beginPath();
      const path = new Path2D(toPathPolyline(pts) + ' Z');
      ctx.stroke(path);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    const poly = new Path2D(toPathPolyline(radarPoints(values, cx, cy, r)) + ' Z');
    ctx.stroke(poly);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.25;
    ctx.fill(poly);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.fillStyle = primary;
    ctx.font = '400 18px "Inter Variable", system-ui, sans-serif';
    dims.forEach((d, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / values.length;
      const lx = cx + (r + 30) * Math.cos(angle);
      const ly = cy + (r + 30) * Math.sin(angle);
      ctx.textAlign = angle > -Math.PI / 2 + 0.01 && angle < Math.PI / 2 ? 'left' : 'right';
      ctx.fillText(`${d.label} %${Math.round(d.affinity * 100)}`, lx, ly + 6);
    });
    ctx.textAlign = 'left';

    let y = 260;
    for (const d of dims) {
      ctx.fillStyle = primary;
      ctx.font = '500 22px "Inter Variable", system-ui, sans-serif';
      ctx.fillText(d.label, 540, y);
      ctx.fillStyle = 'rgba(245, 241, 232, 0.15)';
      ctx.fillRect(540, y + 12, 400, 12);
      ctx.fillStyle = accent;
      ctx.fillRect(540, y + 12, Math.round(400 * d.affinity), 12);
      ctx.fillStyle = primary;
      ctx.font = '400 16px "Inter Variable", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(245, 241, 232, 0.6)';
      ctx.fillText(d.evidenceText, 540, y + 46);
      y += 76;
    }

    ctx.fillStyle = 'rgba(245, 241, 232, 0.5)';
    ctx.font = '400 16px "Inter Variable", system-ui, sans-serif';
    ctx.fillText('lmdb · kişisel tat profili · geri alınabilir', 56, canvas.height - 48);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  } catch {
    return null;
  }
}
