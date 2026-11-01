/**
 * Oda davet kartı: kod, kopyalanabilir bağlantı ve QR.
 * QR `qrcode` paketiyle data URL üretilir (CSP img-src data: izinli).
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui';

interface ShareCardProps {
  code: string;
}

export function ShareCard({ code }: ShareCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/birlikte?oda=${code}`
    : `/birlikte?oda=${code}`;

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(link, { margin: 1, width: 220, color: { light: '#0d0c0f', dark: '#d4af37' } })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {
        if (alive) setQrDataUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [link]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pano izni yok — kod elle okunabilir */
    }
  };

  return (
    <div className="rounded-lg border border-line-strong bg-surface-raised p-5 shadow-cine">
      <h3 className="font-display text-lg text-primary">Odaya Katıl</h3>
      <p className="mt-1 text-sm text-secondary">
        Bu kodu arkadaşlarına gönder — kayıt gerekmez.
      </p>
      <p
        className="mt-4 text-center font-display text-4xl tracking-[0.3em] text-accent"
        aria-label={`Oda kodu ${[...code].join(' ')}`}
      >
        {code}
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="Oda davet QR kodu"
            width={140}
            height={140}
            className="rounded-md border border-line-strong"
          />
        )}
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? 'Kopyalandı' : 'Bağlantıyı Kopyala'}
          </Button>
          <span className="max-w-[14rem] truncate text-xs text-muted" title={link}>
            {link}
          </span>
        </div>
      </div>
    </div>
  );
}
