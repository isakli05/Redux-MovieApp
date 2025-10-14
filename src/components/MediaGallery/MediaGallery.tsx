/**
 * MediaGallery Component
 * Main container component for media gallery with tabs
 */

import { memo } from 'react';
import { 
  FilmIcon, 
  PhotoIcon, 
  RectangleStackIcon, 
  SparklesIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import { useMediaGallery } from '../../hooks/useMediaGallery';
import MediaGalleryTabs from './MediaGalleryTabs';
import VideoGallery from './VideoGallery';
import ImageGallery from './ImageGallery';
import MediaGalleryErrorBoundary from './MediaGalleryErrorBoundary';
import Loading from '../Loading';
import type { MediaGalleryProps, MediaTab } from '../../types/media';

const MediaGallery = memo<MediaGalleryProps>(({ mediaType, id, seasonNumber, defaultTab, gender }) => {
  const {
    activeTab,
    setActiveTab,
    availableTabs,
    images,
    videos,
    isLoading,
    error,
  } = useMediaGallery({ mediaType, id, seasonNumber, defaultTab });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Medya içerikleri yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return null;
  }

  // Gender-based color theme (for person pages)
  const isMale = gender === 2;
  const isFemale = gender === 1;
  const hasGender = isMale || isFemale;
  
  const gradientBar = hasGender
    ? isMale 
      ? 'from-blue-400 to-cyan-500' 
      : 'from-purple-400 to-pink-500'
    : 'from-cyan-400 to-blue-500'; // Default

  const tabConfig: Record<MediaTab, { icon: any; label: string; count: number }> = {
    videos: { icon: FilmIcon, label: 'Videolar', count: videos.length },
    posters: { icon: PhotoIcon, label: 'Posterler', count: images.posters?.length || 0 },
    backdrops: { icon: RectangleStackIcon, label: 'Arka Planlar', count: images.backdrops?.length || 0 },
    logos: { icon: SparklesIcon, label: 'Logolar', count: images.logos?.length || 0 },
    profiles: { icon: UserCircleIcon, label: 'Profil Fotoğrafları', count: images.profiles?.length || 0 },
  };

  return (
    <MediaGalleryErrorBoundary>
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className={`w-1 h-8 bg-gradient-to-b ${gradientBar} rounded-full`} />
          Medya Galerisi
        </h2>

        <MediaGalleryTabs
          tabs={availableTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabConfig={tabConfig}
          gender={gender}
        />

        <div className="mt-6">
          {activeTab === 'videos' && <VideoGallery videos={videos} />}
          {activeTab !== 'videos' && (
            <ImageGallery
              images={images[activeTab] || []}
              category={activeTab}
            />
          )}
        </div>
      </section>
    </MediaGalleryErrorBoundary>
  );
});

MediaGallery.displayName = 'MediaGallery';

export default MediaGallery;
