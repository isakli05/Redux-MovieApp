/**
 * TasteCardShare — paylaşılabilir tat kartı. Metin panoya kopyalanır;
 * görsel istemci tarafında canvas ile üretilip indirilir. Sunucuya hiçbir
 * profil verisi gitmez.
 */
import { useState } from 'react';
import { shareText, renderShareCard } from '../../lib/dna/share';
import type { DnaProfile } from '../../lib/dna/profile';
import { Button } from '../ui';

export default function TasteCardShare({ profile }: { profile: DnaProfile }) {
  const [copied, setCopied] = useState(false);
  const [imgState, setImgState] = useState<'idle' | 'ok' | 'unsupported'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(profile));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const download = async () => {
    const blob = await renderShareCard(profile);
    if (!blob) {
      setImgState('unsupported');
      return;
    }
    setImgState('ok');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sinema-dna-karti.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4" data-testid="dna-share">
      <h2 className="font-display text-base font-semibold text-primary">Tat kartını paylaş</h2>
      <p className="mt-1 text-sm text-secondary">
        Kart yalnızca kanıtlı eğilimleri taşır; kanıt azaldıkça kart da küçülür. Bu cihazda
        üretilir, hiçbir sunucuya gönderilmez.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button variant="primary" size="sm" onClick={copy}>
          {copied ? 'Metin kopyalandı' : 'Metni kopyala'}
        </Button>
        <Button variant="outline" size="sm" onClick={download}>
          Kart görselini indir
        </Button>
      </div>
      {imgState === 'unsupported' && (
        <p className="mt-2 text-xs text-muted" role="status">
          Bu tarayıcı görsel üretimini desteklemiyor — metin sürümünü kullanabilirsin.
        </p>
      )}
    </div>
  );
}
