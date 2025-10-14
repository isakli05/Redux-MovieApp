/**
 * VideoGallery Component
 * Displays a grid of video cards with featured video
 */

import { memo, useMemo } from 'react';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import type { Video } from '../../types/videos';

interface VideoGalleryProps {
  videos: Video[];
}

const VideoGallery = memo<VideoGalleryProps>(({ videos }) => {
  const { selectedVideo, openVideo, closeVideo } = useVideoPlayer();

  // Sort videos by priority: Trailer > Teaser > Clip > Behind the Scenes > Featurette
  const sortedVideos = useMemo(() => {
    const priorityOrder = ['Trailer', 'Teaser', 'Clip', 'Behind the Scenes', 'Featurette'];
    
    return [...videos]
      .filter(video => video.site === 'YouTube')
      .sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.type);
        const bIndex = priorityOrder.indexOf(b.type);
        const aOrder = aIndex === -1 ? priorityOrder.length : aIndex;
        const bOrder = bIndex === -1 ? priorityOrder.length : bIndex;
        return aOrder - bOrder;
      });
  }, [videos]);

  if (sortedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Video bulunamadı.</p>
      </div>
    );
  }

  const featuredVideo = sortedVideos[0];
  const remainingVideos = sortedVideos.slice(1);

  return (
    <div className="space-y-6">
      {/* Featured Video */}
      <div className="relative group">
        <VideoCard
          video={featuredVideo}
          onClick={() => openVideo(featuredVideo)}
          featured
        />
      </div>

      {/* Remaining Videos Grid */}
      {remainingVideos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {remainingVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => openVideo(video)}
            />
          ))}
        </div>
      )}

      {/* Video Modal */}
      <VideoModal
        isOpen={selectedVideo !== null}
        video={selectedVideo}
        onClose={closeVideo}
      />
    </div>
  );
});

VideoGallery.displayName = 'VideoGallery';

export default VideoGallery;
