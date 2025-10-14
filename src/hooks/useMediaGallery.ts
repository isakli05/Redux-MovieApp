/**
 * useMediaGallery Hook
 * Orchestrates media gallery data fetching and state management
 */

import { useState, useMemo, useCallback } from 'react';
import { 
  useGetMovieImagesQuery, 
  useGetTVImagesQuery, 
  useGetSeasonImagesQuery, 
  useGetPersonImagesQuery 
} from '../api/endpoints/media.endpoints';
import { 
  useGetMovieVideosQuery
} from '../api/endpoints/movies.endpoints';
import {
  useGetTVShowVideosQuery,
  useGetSeasonVideosQuery
} from '../api/endpoints/tv.endpoints';
import type { MediaGalleryProps, MediaTab, TMDBImage } from '../types/media';
import type { Video } from '../types/videos';

interface UseMediaGalleryReturn {
  activeTab: MediaTab;
  setActiveTab: (tab: MediaTab) => void;
  availableTabs: MediaTab[];
  images: {
    posters?: TMDBImage[];
    backdrops?: TMDBImage[];
    logos?: TMDBImage[];
    profiles?: TMDBImage[];
  };
  videos: Video[];
  isLoading: boolean;
  error: any;
}

export const useMediaGallery = ({
  mediaType,
  id,
  seasonNumber,
  defaultTab = 'videos',
}: MediaGalleryProps): UseMediaGalleryReturn => {
  const [activeTab, setActiveTab] = useState<MediaTab>(defaultTab);

  // Fetch images based on media type
  const { data: movieImages, isLoading: movieImagesLoading, error: movieImagesError } = 
    useGetMovieImagesQuery(id, { skip: mediaType !== 'movie' });
  
  const { data: tvImages, isLoading: tvImagesLoading, error: tvImagesError } = 
    useGetTVImagesQuery(id, { skip: mediaType !== 'tv' });
  
  const { data: seasonImages, isLoading: seasonImagesLoading, error: seasonImagesError } = 
    useGetSeasonImagesQuery(
      { tvId: id, seasonNumber: seasonNumber! },
      { skip: mediaType !== 'season' || !seasonNumber }
    );
  
  const { data: personImages, isLoading: personImagesLoading, error: personImagesError } = 
    useGetPersonImagesQuery(id, { skip: mediaType !== 'person' });

  // Fetch videos based on media type
  const { data: movieVideos, isLoading: movieVideosLoading } = 
    useGetMovieVideosQuery(id, { skip: mediaType !== 'movie' });
  
  const { data: tvVideos, isLoading: tvVideosLoading } = 
    useGetTVShowVideosQuery(id, { skip: mediaType !== 'tv' });
  
  const { data: seasonVideos, isLoading: seasonVideosLoading } = 
    useGetSeasonVideosQuery(
      { tvId: id, seasonNumber: seasonNumber! },
      { skip: mediaType !== 'season' || !seasonNumber }
    );

  // Aggregate loading states
  const isLoading = useMemo(() => {
    return movieImagesLoading || tvImagesLoading || seasonImagesLoading || 
           personImagesLoading || movieVideosLoading || tvVideosLoading || seasonVideosLoading;
  }, [movieImagesLoading, tvImagesLoading, seasonImagesLoading, personImagesLoading, 
      movieVideosLoading, tvVideosLoading, seasonVideosLoading]);

  // Aggregate errors
  const error = movieImagesError || tvImagesError || seasonImagesError || personImagesError;

  // Normalize images data
  const images = useMemo(() => {
    const imageData = movieImages || tvImages || seasonImages;
    const personImageData = personImages;

    if (personImageData) {
      return { profiles: personImageData.profiles };
    }

    return {
      posters: imageData?.posters || [],
      backdrops: imageData?.backdrops || [],
      logos: imageData?.logos || [],
    };
  }, [movieImages, tvImages, seasonImages, personImages]);

  // Normalize videos data
  const videos = useMemo(() => {
    const videoData = movieVideos || tvVideos || seasonVideos;
    return videoData?.results || [];
  }, [movieVideos, tvVideos, seasonVideos]);

  // Calculate available tabs
  const availableTabs = useMemo(() => {
    const tabs: MediaTab[] = [];
    
    if (videos.length > 0) tabs.push('videos');
    if (images.posters && images.posters.length > 0) tabs.push('posters');
    if (images.backdrops && images.backdrops.length > 0) tabs.push('backdrops');
    if (images.logos && images.logos.length > 0) tabs.push('logos');
    if (images.profiles && images.profiles.length > 0) tabs.push('profiles');
    
    return tabs;
  }, [videos, images]);

  return {
    activeTab,
    setActiveTab: useCallback((tab: MediaTab) => setActiveTab(tab), []),
    availableTabs,
    images,
    videos,
    isLoading,
    error,
  };
};
