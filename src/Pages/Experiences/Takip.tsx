/**
 * F6 — Takip: spoiler korumalı dizi bölüm takibi.
 * Takip listesi `follow_show` olaylarından, ilerleme `episode_watched`
 * olaylarından türetilir (SHARED_CONTRACTS §B/§E); TMDB yalnızca zenginleştirme
 * için kullanılır ve başarısız olursa sayfa nazikçe bozunur.
 */
import { Button, EmptyState, SectionHeader } from '../../components/ui';
import { useSEO } from '../../hooks/useSEO';
import { useTracker } from '../../lib/tracker/useTracker';
import FollowedShowCard from '../../components/Tracker/FollowedShowCard';

export default function Takip() {
  const { follows } = useTracker();
  useSEO({
    title: 'Takip',
    description: 'Dizilerini bölüm bölüm, spoiler korumalı takip et.',
  });

  const entries = [...follows.entries()].sort(
    (a, b) => (b[1].at ?? 0) - (a[1].at ?? 0), // en son takip edilen başta
  );

  return (
    <section className="mx-auto min-h-screen max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        title="Takip"
        eyebrow="LMDB Deneyimleri"
        as="h1"
        className="mb-8"
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Henüz takip ettiğin dizi yok"
          hint="Bir dizi sayfasında “Takip Et”e bas; bölümlerini burada, spoilerlara karşı korumalı takip et."
          action={
            <Button to="/tv" variant="outline">
              Dizilere Göz At
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.map(([tvId, event]) => (
            <FollowedShowCard
              key={tvId}
              tvId={tvId}
              fallbackTitle={event.target.title}
              fallbackPosterPath={event.target.posterPath ?? null}
            />
          ))}
        </div>
      )}
    </section>
  );
}
