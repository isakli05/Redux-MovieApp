/**
 * ComparePair — ikili tat karşılaştırması: "hangisi daha çok senin tarzın?"
 * Seçim comparison_win olayı olarak günlüğe yazılır (target = kazanan, vs = diğer).
 * Poster düğmeleri gerçek <button>: klavye ile erişilebilir, odak halkalı.
 */
import { useMemo } from 'react';
import { logInteraction } from '../../lib/interactions';
import type { Interaction } from '../../lib/interactions';
import { nextPair, type PoolItem } from '../../lib/dna/onboarding';
import { TMDB_CONFIG, IMAGE_SIZES } from '../../utils/constants';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void';

interface ComparePairProps {
  pool: PoolItem[];
  events: Interaction[];
  accountId?: number | null;
}

function PosterButton({ item, onPick }: { item: PoolItem; onPick: () => void }) {
  const title = item.ref.title ?? `${item.ref.kind} ${item.ref.id}`;
  const src = item.ref.posterPath
    ? `${TMDB_CONFIG.IMAGE_BASE_URL}/${IMAGE_SIZES.POSTER.MEDIUM}${item.ref.posterPath}`
    : '/assets/tv_null.svg';
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`Seç: ${title}`}
      className={`group flex w-full flex-col items-center gap-3 rounded-lg border border-line bg-surface-raised p-3 transition-colors duration-150 ease-cine hover:border-accent ${FOCUS_RING}`}
      data-testid="compare-choice"
    >
      <img
        src={src}
        alt={title}
        loading="lazy"
        className="h-56 w-36 rounded-md object-cover sm:h-72 sm:w-48"
      />
      <span className="line-clamp-2 text-center font-medium text-primary">{title}</span>
      <span className="text-xs text-muted group-hover:text-accent">bu daha çok benim tarzım</span>
    </button>
  );
}

export default function ComparePair({ pool, events, accountId }: ComparePairProps) {
  // events güncellendiğinde yeni çift seçilir (useInteractions reaktif).
  const pair = useMemo(() => nextPair(pool, events), [pool, events]);

  if (!pair) {
    return (
      <p className="py-8 text-center text-sm text-secondary" data-testid="compare-exhausted">
        Havuzdaki tüm çiftler soruldu — yeni karşılaştırmalar için profil sayfasındaki
        etkinliklerin artması gerekir. Şimdilik teşekkürler!
      </p>
    );
  }

  const pick = (winner: PoolItem, loser: PoolItem) => {
    // Seçim yazıldığında useInteractions tetiklenir, events yenilenir,
    // useMemo yeni çift üretir — ekstra durum yönetimi gerekmez.
    logInteraction(
      {
        kind: 'comparison_win',
        target: { ...winner.ref },
        vs: { ...loser.ref },
        source: 'dna',
      },
      accountId,
    );
  };

  return (
    <div>
      <p className="mb-6 text-center text-secondary" role="status">
        Hangisi daha çok senin tarzın? Cevabın profilini anında günceller — atlamak serbest.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
        {pair.map((item, i) => (
          <PosterButton key={`${item.ref.kind}:${item.ref.id}`} item={item} onPick={() => pick(item, pair[1 - i])} />
        ))}
      </div>
    </div>
  );
}
