/**
 * DataPrivacyPanel — tam denetim: her olayı gör, tek tek kaldır (profil anında
 * yeniden hesaplanır), kapsamları ayır, tümünü sil, anonim özet çıkar.
 * Gizlilik perdesi (anonim mod) profil içeriğini ortak ekranlardan gizler.
 */
import { useMemo, useState } from 'react';
import {
  clearInteractions,
  removeInteraction,
  type Interaction,
  type InteractionKind,
} from '../../lib/interactions';
import { exportGroupSummary, type DnaProfile } from '../../lib/dna/profile';
import { genreLabel } from '../../lib/dna/genres';
import { Button } from '../ui';

const KIND_LABELS: Record<InteractionKind, string> = {
  like: 'beğeni',
  dislike: 'olumsuz',
  seen: 'izleme',
  rating: 'puan',
  comparison_win: 'karşılaştırma kazandı',
  comparison_lose: 'karşılaştırma kaybetti',
  seans_reject: 'seans dışlama',
  episode_watched: 'bölüm izlendi',
  follow_show: 'dizi takibi',
};

const SOURCE_LABELS: Record<string, string> = {
  seans: 'Seans',
  dna: 'DNA',
  tracker: 'Takip',
  group: 'Birlikte İzle',
  mystery: 'Bilmece',
  manual: 'elle/TMDB',
};

function eventLabel(e: Interaction): string {
  const title = e.target.title ?? `${e.target.kind}:${e.target.id}`;
  if ((e.kind === 'comparison_win' || e.kind === 'comparison_lose') && e.vs) {
    return `${title} › ${e.vs.title ?? `${e.vs.kind}:${e.vs.id}`}`;
  }
  if (e.kind === 'rating') return `${title} — ${e.value}/10`;
  if (e.kind === 'episode_watched') return `${title} S${e.season}·B${e.episode}`;
  return title;
}

interface DataPrivacyPanelProps {
  events: Interaction[];
  accountId?: number | null;
  accountName?: string | null;
  profile: DnaProfile;
  privacyOn: boolean;
  onTogglePrivacy: () => void;
}

export default function DataPrivacyPanel({
  events,
  accountId,
  accountName,
  profile,
  privacyOn,
  onTogglePrivacy,
}: DataPrivacyPanelProps) {
  const [confirmAll, setConfirmAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const recent = useMemo(() => [...events].sort((a, b) => b.at - a.at).slice(0, 200), [events]);
  const summary = useMemo(() => exportGroupSummary(profile), [profile]);

  const copySummary = async () => {
    const text = JSON.stringify(summary);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="dna-scope-h" className="rounded-lg border border-line bg-surface-raised p-4">
        <h2 id="dna-scope-h" className="font-display text-base font-semibold text-primary">
          Veri kapsamın
        </h2>
        <p className="mt-1 text-sm text-secondary">
          {accountId
            ? `Girişli hesap${accountName ? ` (${accountName})` : ''} — veriler bu tarayıcıda, hesap anahtarıyla ayrı tutuluyor. Giriş yapılmadan bıraktığın izler girişte bu kapsama katılır (kopyalanır, silinmez).`
            : 'Anonim oturum — veriler yalnızca bu tarayıcıda, hesabına bağlı değil. Giriş yaptığında hesap kapsamına birleşir.'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" aria-pressed={privacyOn} onClick={onTogglePrivacy}>
            {privacyOn ? 'Gizlilik perdesi: açık' : 'Gizlilik perdesi: kapalı'}
          </Button>
          <span className="text-xs text-muted">
            Açıkken profil içerikleri ortak ekranlarda gizlenir.
          </span>
        </div>
      </section>

      <section aria-labelledby="dna-export-h" className="rounded-lg border border-line bg-surface-raised p-4">
        <h2 id="dna-export-h" className="font-display text-base font-semibold text-primary">
          Birlikte İzle için anonim özet
        </h2>
        <p className="mt-1 text-sm text-secondary">
          Yalnızca tür ağırlıkları paylaşılır — başlık, kişi adı, hesap veya cihaz bilgisi
          çıkmaz. Kopyaladığın metni odadaki yapıştırma alanına sen koyarsun.
        </p>
        {Object.keys(summary.genres).length > 0 ? (
          <>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Paylaşılacak tür ağırlıkları">
              {Object.entries(summary.genres).map(([k, w]) => (
                <li key={k} className="rounded-full border border-line bg-surface-overlay px-3 py-1 text-xs text-secondary">
                  {genreLabel(k)} %{Math.round(w * 100)}
                </li>
              ))}
            </ul>
            <Button variant="primary" size="sm" className="mt-3" onClick={copySummary}>
              {copied ? 'Kopyalandı' : 'Özeti kopyala'}
            </Button>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">Paylaşılacak tür ağırlığı henüz yok.</p>
        )}
      </section>

      <section aria-labelledby="dna-events-h" className="rounded-lg border border-line bg-surface-raised p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="dna-events-h" className="font-display text-base font-semibold text-primary">
            Olay günlüğü ({events.length})
          </h2>
          <p className="text-xs text-muted">Son 200 olay gösterilir. Kaldırdığın olay profilden anında çıkar.</p>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted" data-testid="dna-events-empty">
            Kayıtlı olay yok.
          </p>
        ) : (
          <ul className="mt-3 max-h-96 divide-y divide-line overflow-y-auto" data-testid="dna-events-list">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-primary">{eventLabel(e)}</p>
                  <p className="text-xs text-muted">
                    {KIND_LABELS[e.kind]} · {SOURCE_LABELS[e.source] ?? e.source} ·{' '}
                    {new Date(e.at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Kaldır: ${eventLabel(e)}`}
                  onClick={() => removeInteraction(e.id, accountId)}
                >
                  Kaldır
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-line pt-4">
          {confirmAll ? (
            <div className="flex flex-wrap items-center gap-3" role="alertdialog" aria-label="Tüm veriyi silme onayı">
              <span className="text-sm text-secondary">
                Tüm etkileşim geçmişi (Seans, Takip dahil) bu kapsamda kalıcı olarak silinir. Emin misin?
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearInteractions(accountId);
                  setConfirmAll(false);
                }}
              >
                Evet, hepsini sil
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmAll(false)}>
                Vazgeç
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmAll(true)}>
              Tüm etkileşim geçmişini sil
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
