import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  useGetTVShowDetailsQuery,
  useGetSeasonVideosQuery,
  useGetSeasonAggregateCreditsQuery 
} from '../../api/endpoints/tv.endpoints';
import { extractIdFromSlug } from '../../utils';
import TvSeasonListBanner from '../../components/Tvs/TvSeasonListBanner';
import StatsOverview from '../../components/Tvs/StatsOverview';
import SeasonsFilterBar, { 
  type SeasonFilters, 
  type SeasonSortConfig 
} from '../../components/Tvs/SeasonsFilterBar';
import SeasonCard from '../../components/Tvs/SeasonCard';
import SeasonTrailerModal from '../../components/Tvs/SeasonTrailerModal';
import Loading from '../../components/Loading';
import { filterAndSortSeasons } from '../../utils/seasonFilters';
import type { SeasonVideo } from '../../types/seasonVideos';

function TvSeasonsList() {
  const { tv_id } = useParams();
  const tvId = extractIdFromSlug(tv_id);

  // Fetch TV show details
  const { data: tvDetail, isLoading, error } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  // State management
  const [sortConfig, setSortConfig] = useState<SeasonSortConfig>({
    sortBy: 'season_number',
    sortOrder: 'asc',
  });

  const [filters, setFilters] = useState<SeasonFilters>({
    minRating: 0,
    status: 'all',
  });

  const [selectedVideo, setSelectedVideo] = useState<SeasonVideo | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Check if filters are active
  const hasActiveFilters = filters.minRating > 0 || filters.status !== 'all';

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sort change
  const handleSortChange = (sortBy: SeasonSortConfig['sortBy'], sortOrder: SeasonSortConfig['sortOrder']) => {
    setSortConfig({ sortBy, sortOrder });
  };

  // Handle filter change
  const handleFilterChange = (newFilters: SeasonFilters) => {
    setFilters(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      minRating: 0,
      status: 'all',
    });
  };

  // Apply filters and sorting
  const processedSeasons = useMemo(() => {
    if (!tvDetail?.seasons) return [];
    return filterAndSortSeasons(tvDetail.seasons, filters, sortConfig);
  }, [tvDetail?.seasons, filters, sortConfig]);

  // Loading state
  if (isLoading || !tvDetail) {
    return <Loading />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-xl font-semibold">Sezonlar yüklenirken bir hata oluştu</p>
          <p className="text-slate-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Banner */}
      <TvSeasonListBanner tv_id={tv_id!} />

      {/* Stats Overview */}
      <div className="container mx-auto px-4 py-8">
        <StatsOverview seasons={tvDetail.seasons} />
      </div>

      {/* Filter Bar */}
      <SeasonsFilterBar
        sortConfig={sortConfig}
        filters={filters}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Seasons Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {processedSeasons.length > 0 ? (
            processedSeasons.map((season) => (
              <SeasonCardWithData
                key={season.id}
                season={season}
                tvId={tvId!}
                tvName={tvDetail.name}
                onTrailerClick={setSelectedVideo}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {hasActiveFilters 
                  ? 'Filtrelere uygun sezon bulunamadı.' 
                  : 'Sezon bilgisi bulunamadı.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {selectedVideo && (
        <SeasonTrailerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-cyan-500 to-blue-500 
                     rounded-full shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 
                     transition-all duration-300 hover:scale-110 z-50 animate-fadeIn"
          aria-label="Başa dön"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Wrapper component to fetch season-specific data
function SeasonCardWithData({ 
  season, 
  tvId, 
  tvName, 
  onTrailerClick 
}: { 
  season: any; 
  tvId: string; 
  tvName: string; 
  onTrailerClick: (video: SeasonVideo) => void;
}) {
  // Fetch season videos
  const { data: videosData } = useGetSeasonVideosQuery(
    { tvId, seasonNumber: season.season_number },
    { skip: !tvId }
  );

  // Fetch season credits
  const { data: creditsData } = useGetSeasonAggregateCreditsQuery(
    { tvId, seasonNumber: season.season_number },
    { skip: !tvId }
  );

  return (
    <SeasonCard
      season={season}
      tvId={tvId}
      tvName={tvName}
      videos={videosData?.results}
      cast={creditsData?.cast}
      onTrailerClick={onTrailerClick}
    />
  );
}

export default TvSeasonsList;
