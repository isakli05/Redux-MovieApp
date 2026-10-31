/**
 * MediaGallery Component
 * Main container component for media gallery with tabs
 */

import { memo } from 'react';
import type { ComponentType } from 'react';
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
        <p className="text-danger">Medya içerikleri yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return null;
  }

  const tabConfig: Record<MediaTab, { icon: ComponentType<{ className?: string }>; label: string; count: number }> = {
    videos: { icon: FilmIcon, label: 'Videolar', count: videos.length },
    posters: { icon: PhotoIcon, label: 'Posterler', count: images.posters?.length || 0 },
    backdrops: { icon: RectangleStackIcon, label: 'Arka Planlar', count: images.backdrops?.length || 0 },
    logos: { icon: SparklesIcon, label: 'Logolar', count: images.logos?.length || 0 },
    profiles: { icon: UserCircleIcon, label: 'Profil Fotoğrafları', count: images.profiles?.length || 0 },
  };

  return (
    <MediaGalleryErrorBoundary>
      <section className="space-y-6">
        <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-primary">
          <div className="h-8 w-1 rounded-full bg-accent" aria-hidden="true" />
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
