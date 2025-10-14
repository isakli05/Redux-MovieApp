/**
 * useVideoPlayer Hook
 * Manages video player state for video modals
 */

import { useState, useCallback } from 'react';
import type { Video } from '../types/videos';

interface UseVideoPlayerReturn {
  selectedVideo: Video | null;
  isPlaying: boolean;
  openVideo: (video: Video) => void;
  closeVideo: () => void;
  togglePlay: () => void;
}

/**
 * Custom hook for managing video player state
 * @returns Video player state and control functions
 */
export const useVideoPlayer = (): UseVideoPlayerReturn => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const openVideo = useCallback((video: Video) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  }, []);

  const closeVideo = useCallback(() => {
    setSelectedVideo(null);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  return {
    selectedVideo,
    isPlaying,
    openVideo,
    closeVideo,
    togglePlay,
  };
};
