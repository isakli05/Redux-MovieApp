/**
 * Sonuç paneli — reveal fazında HERKESTE aynı anda görünen nihai karar.
 * Karşılıklı eşleşme varsa onu; yoksa açıklanabilir ağırlıklı uzlaşıyı
 * (n×çok isterim, n×izlerim, veto sayıları) gösterir. Beraberlik ve
 * eşleşme-yok durumları ayrıca adlandırılır.
 */

import { Link } from 'react-router-dom';
import type { RoomResult, RoomResultEntry } from '../../lib/group/api';
import { getImageUrl } from '../../utils';

function breakdownText(e: RoomResultEntry): string {
  const parts: string[] = [];
  if (e.strong > 0) parts.push(`${e.strong} × çok isterim`);
  if (e.like > 0) parts.push(`${e.like} × izlerim`);
  if (e.skip > 0) parts.push(`${e.skip} × pas`);
  if (e.dislike > 0) parts.push(`${e.dislike} × veto`);
  return parts.length > 0 ? parts.join(', ') : 'oy yok';
}

function reasonLine(result: RoomResult): string {
  switch (result.reason) {
    case 'match':
      return 'Herkese uyan tek bir aday çıktı — karşılıklı eşleşme!';
    case 'compromise':
      return 'Tam eşleşme yok; grup puanı en yüksek uzlaşı adayı seçildi.';
    case 'tie':
      return 'İki aday eş puan aldı; ilk sıradaki öne çıkarıldı.';
    case 'all_vetoed':
      return 'Her aday en az bir veto aldı. Kısıtları gevşetip yeni bir oda kurmayı deneyin.';
    case 'no_votes':
      return 'Yeterli oy toplanmadı.';
  }
}

function EntryRow({ entry, rank }: { entry: RoomResultEntry; rank: number }) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-line bg-surface-raised p-2.5">
      <span className="w-6 text-center font-display text-sm text-muted">{rank}.</span>
      <img
        src={getImageUrl(entry.posterPath, 'w92')}
        alt=""
        loading="lazy"
        width={40}
        height={60}
        className="h-[60px] w-[40px] rounded-sm object-cover"
      />
      <div className="min-w-0 flex-1">
        <Link
          to={`/${entry.kind}/${entry.id}`}
          className="truncate font-display text-sm text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {entry.title}
        </Link>
        <p className="text-xs text-secondary">
          {breakdownText(entry)}
          {entry.mutual && <span className="text-accent"> · herkese uyan</span>}
          {entry.boosted && <span className="text-muted"> · DNA ağırlıklı</span>}
        </p>
      </div>
      <span className="font-display text-base text-accent" aria-label={`Puan ${entry.score}`}>
        {entry.score}
      </span>
    </li>
  );
}

export function ResultPanel({ result }: { result: RoomResult }) {
  const winner = result.winner;

  return (
    <section aria-live="polite" className="animate-fade-in space-y-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Akşamın Kararı</p>
        <p className="mt-2 text-sm text-secondary">{reasonLine(result)}</p>
      </div>

      {winner ? (
        <div className="mx-auto max-w-md rounded-lg border border-line-strong bg-surface-raised p-5 text-center">
          <img
            src={getImageUrl(winner.posterPath, 'w342')}
            alt=""
            width={220}
            className="mx-auto max-h-[300px] rounded-md"
          />
          <h2 className="mt-4 font-display text-2xl text-primary">{winner.title}</h2>
          <p className="mt-1 text-xs text-muted">{winner.year ?? '—'}</p>
          <p className="mt-3 text-sm text-secondary">{breakdownText(winner)}</p>
          <p className="mt-1 text-sm text-accent">Grup puanı: {winner.score}</p>
          <Link
            to={`/${winner.kind}/${winner.id}`}
            className="mt-4 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink transition-colors duration-150 ease-cine hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void"
          >
            Detayları Gör
          </Link>
        </div>
      ) : (
        <div className="mx-auto max-w-md rounded-lg border border-line bg-surface-raised p-6 text-center text-secondary">
          Ortak bir aday çıkarılamadı.
        </div>
      )}

      {result.ranking.length > 1 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-secondary">Sıralama</h3>
          <ol className="space-y-2">
            {result.ranking.map((e, i) => (
              <EntryRow key={e.key} entry={e} rank={i + 1} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
