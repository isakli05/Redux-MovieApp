import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  useGetTVSeasonDetailsQuery, 
  useGetTVShowDetailsQuery 
} from '../../api/endpoints/tv.endpoints';
import { extractIdFromSlug } from '../../utils';
import EnhancedSeasonHeader from '../../components/Tvs/EnhancedSeasonHeader';
import EpisodeStatistics from '../../components/Tvs/EpisodeStatistics';
import EpisodeFilterBar, { type EpisodeSortOption, type SortOrder } from '../../components/Tvs/EpisodeFilterBar';
import EnhancedEpisodeCard from '../../components/Tvs/EnhancedEpisodeCard';
import MediaGallery from '../../components/MediaGallery/MediaGallery';
import Loading from '../../components/Loading';
import { sortEpisodes } from '../../utils/episodeSort';

function TvSeasonDetail() {
  const { tv_id, season_number } = useParams<{ tv_id: string; season_number: string }>();
  const tvId = extractIdFromSlug(tv_id);
  const seasonNum = Number(season_number);

  // Fetch season details
  const { data: seasonDetail, isLoading: isSeasonLoading, error: seasonError } = useGetTVSeasonDetailsQuery(
    { tvId: tvId!, seasonNumber: seasonNum },
    { skip: !tvId || !season_number }
  );

  // Fetch TV show details for navigation
  const { data: tvDetail, isLoading: isTvLoading } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  // State for sorting
  const [sortBy, setSortBy] = useState<EpisodeSortOption>('episode_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Handle sort change
  const handleSortChange = (newSortBy: EpisodeSortOption, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Sort episodes
  const sortedEpisodes = useMemo(() => {
    if (!seasonDetail?.episodes) return [];
    return sortEpisodes(seasonDetail.episodes, sortBy, sortOrder);
  }, [seasonDetail?.episodes, sortBy, sortOrder]);

  // Loading state
  if (isSeasonLoading || isTvLoading || !seasonDetail || !tvDetail) {
    return <Loading />;
  }

  // Error state
  if (seasonError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-xl font-semibold">Sezon bilgileri yüklenirken bir hata oluştu</p>
          <p className="text-slate-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Header */}
      <EnhancedSeasonHeader
        seasonDetail={seasonDetail}
        tvDetail={tvDetail}
        tvId={tvId!}
        seasonNumber={seasonNum}
      />

      {/* Media Gallery */}
      <div className="container mx-auto px-4 py-8">
        <MediaGallery
          mediaType="season"
          id={tvId!}
          seasonNumber={seasonNum}
          defaultTab="videos"
        />
      </div>

      {/* Statistics */}
      <div className="container mx-auto px-4 py-8">
        <EpisodeStatistics episodes={seasonDetail.episodes || []} />
      </div>

      {/* Filter Bar */}
      <EpisodeFilterBar
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        totalEpisodes={seasonDetail.episodes?.length || 0}
      />

      {/* Episodes List */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {sortedEpisodes.length > 0 ? (
            sortedEpisodes.map((episode) => (
              <EnhancedEpisodeCard
                key={episode.id}
                episode={episode}
                tvId={tvId!}
                seasonNumber={seasonNum}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Bu sezon için bölüm bilgisi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TvSeasonDetail;
