/**
 * ImportTmdbPanel — TMDB hesabından tek seferlik okuma içe aktarımı
 * (favoriler + puanlar → `manual` olaylar; SHARED_CONTRACTS §B).
 * TMDB'ye asla geri yazılmaz. İzleme listesi bilinçli olarak olaylara
 * eklenmez: "izlenecek" ≠ "izlendi" — seen olayları Seans dışlamalarını
 * besler ve yanlış bilgi zehreder (sapma raporda belgelendi).
 */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  useGetFavoritesQuery,
  useGetRatedQuery,
  type AccountMediaPage,
  type ListDetailItem,
} from '../../api/user.api';
import { logInteraction } from '../../lib/interactions';
import { Button } from '../ui';

/** TMDB rated yanıtı öğeleri `rating` (0.5–10) alanını da taşır. */
type RatedItem = ListDetailItem & { rating?: number };

function foldResults(
  favorites: { mediaType: 'movie' | 'tv'; data?: AccountMediaPage }[],
  rated: { mediaType: 'movie' | 'tv'; data?: AccountMediaPage }[],
  accountId?: number | null,
): number {
  let n = 0;
  // Favori = açık beğeni sinyali. Puanlıklar yalnızca puan olarak girer;
  // düşük puanlı bir işi "beğeni" saymak profili yanıltırdı.
  for (const { mediaType, data } of favorites) {
    for (const item of data?.results ?? []) {
      logInteraction(
        {
          kind: 'like',
          target: { kind: mediaType, id: item.id, title: item.title ?? item.original_title, posterPath: item.poster_path },
          source: 'manual',
        },
        accountId,
      );
      n++;
    }
  }
  for (const { mediaType, data } of rated) {
    for (const item of data?.results ?? []) {
      const rating = (item as RatedItem).rating;
      if (typeof rating !== 'number' || rating <= 0) continue;
      logInteraction(
        {
          kind: 'rating',
          target: { kind: mediaType, id: item.id, title: item.title ?? item.original_title, posterPath: item.poster_path },
          value: Math.round(rating),
          source: 'manual',
        },
        accountId,
      );
      n++;
    }
  }
  return n;
}

export default function ImportTmdbPanel({ accountId }: { accountId?: number | null }) {
  const { isAuthenticated, login } = useAuth();
  const [active, setActive] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const folded = useRef(false);

  const favMovies = useGetFavoritesQuery({ mediaType: 'movie' }, { skip: !active });
  const favTv = useGetFavoritesQuery({ mediaType: 'tv' }, { skip: !active });
  const ratedMovies = useGetRatedQuery({ mediaType: 'movie' }, { skip: !active });
  const ratedTv = useGetRatedQuery({ mediaType: 'tv' }, { skip: !active });

  const queries = [favMovies, favTv, ratedMovies, ratedTv];
  const allDone = active && queries.every((q) => q.isSuccess || q.isError);

  useEffect(() => {
    if (!allDone || folded.current) return;
    folded.current = true;
    const n = foldResults(
      [
        { mediaType: 'movie', data: favMovies.data },
        { mediaType: 'tv', data: favTv.data },
      ],
      [
        { mediaType: 'movie', data: ratedMovies.data },
        { mediaType: 'tv', data: ratedTv.data },
      ],
      accountId,
    );
    setImported(n);
    try {
      localStorage.setItem(`lmdb:dna:imported${accountId ? `@acct:${accountId}` : ''}`, String(Date.now()));
    } catch {
      /* durum bilgisi yalnızca; yazılamazsa yok sayılır */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, accountId]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-line bg-surface-raised p-4">
        <h2 className="font-display text-base font-semibold text-primary">TMDB hesabından içe aktar</h2>
        <p className="mt-1 text-sm text-secondary">
          TMDB favorilerin ve puanların profiline katılmak için giriş yapabilirsin. İçe aktarma
          yalnızca okunur — hesabına hiçbir şey yazılmaz.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={login}>
          TMDB ile giriş yap
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4" data-testid="dna-import">
      <h2 className="font-display text-base font-semibold text-primary">TMDB hesabından içe aktar</h2>
      <p className="mt-1 text-sm text-secondary">
        Favoriler “beğeni”, puanladıkların “puan” olarak eklenir (ilk sayfa; tekrar çalıştırmak
        çift kayıt yapmaz). İzleme listesi bilinçli olarak eklenmez — izlenecek işaretlemek
        “izlendi” demek değildir.
      </p>
      {imported === null ? (
        <Button
          variant="primary"
          size="sm"
          className="mt-3"
          loading={active}
          disabled={active && allDone}
          onClick={() => setActive(true)}
        >
          {active ? 'İçe aktarılıyor…' : 'Favori ve puanlarımı aktar'}
        </Button>
      ) : (
        <p className="mt-3 text-sm text-success-text" role="status" data-testid="dna-import-done">
          {imported} olay “manual” kaynak olarak günlüğe eklendi. Aynı olaylar tekrarında
          güncellenir, kopya oluşmaz.
        </p>
      )}
    </div>
  );
}
