# Design Document

## Overview

Bu tasarım, TMDB API'nin sunduğu tüm medya içeriklerini (images ve videos) enterprise-grade bir mimari ile uygulamaya entegre eder. Tasarım, SOLID prensipleri, composition pattern, ve React best practices'i takip eder. Reusable, type-safe, performant ve accessible bir medya galeri sistemi oluşturulacaktır.

### Core Design Principles

1. **Separation of Concerns**: API logic, UI components, ve business logic katmanları ayrılmıştır
2. **Composition over Inheritance**: Küçük, reusable component'ler compose edilerek büyük özellikler oluşturulur
3. **Type Safety**: Strict TypeScript kullanımı ile runtime hataları minimize edilir
4. **Performance First**: Lazy loading, memoization, ve virtual scrolling ile optimize edilmiştir
5. **Accessibility**: WCAG 2.1 AA standartlarına uygun, keyboard navigation ve screen reader desteği
6. **Responsive Design**: Mobile-first approach ile tüm cihazlarda mükemmel deneyim

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Movie Detail │  │  TV Detail   │  │Person Detail │      │
│  │     Page     │  │     Page     │  │     Page     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│         ┌──────────────────────────────────────────┐         │
│         │      MediaGallery Component (Smart)      │         │
│         │  - State Management                       │         │
│         │  - Tab Navigation                         │         │
│         │  - Filter & Sort Logic                    │         │
│         └──────────────────┬───────────────────────┘         │
│                            │                                 │
│         ┌──────────────────┼───────────────────┐             │
│         │                  │                   │             │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌──────▼──────┐     │
│  │VideoGallery │  │  ImageGallery   │  │  Lightbox   │     │
│  │ (Presentat.)│  │ (Presentational)│  │   Modal     │     │
│  └─────────────┘  └─────────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Custom Hooks                             │   │
│  │  - useMediaGallery (orchestration)                    │   │
│  │  - useImageLightbox (lightbox state)                  │   │
│  │  - useVideoPlayer (video state)                       │   │
│  │  - useMediaFilter (filter/sort logic)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           RTK Query API Endpoints                     │   │
│  │  - moviesApi.getMovieImages                           │   │
│  │  - tvApi.getTVImages                                  │   │
│  │  - tvApi.getSeasonImages                              │   │
│  │  - personsApi.getPersonImages                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   TMDB API     │
                    └────────────────┘
```

### Component Hierarchy

```
MediaGallery (Container)
├── MediaGalleryTabs
│   ├── TabButton (Videos)
│   ├── TabButton (Posters)
│   ├── TabButton (Backdrops)
│   └── TabButton (Logos)
├── MediaGalleryToolbar
│   ├── FilterDropdown
│   ├── SortDropdown
│   └── ViewModeToggle
├── VideoGallery
│   ├── VideoGrid
│   │   └── VideoCard[]
│   └── VideoModal
│       └── YouTubeEmbed
└── ImageGallery
    ├── ImageGrid (Virtual)
    │   └── ImageCard[]
    └── ImageLightbox
        ├── LightboxImage
        ├── LightboxNavigation
        ├── LightboxToolbar
        └── LightboxMetadata
```

## Components and Interfaces

### 1. Core Type Definitions

**File**: `src/types/media.ts`

```typescript
// Image Types
export interface TMDBImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface ImagesResponse {
  id: number;
  backdrops: TMDBImage[];
  logos: TMDBImage[];
  posters: TMDBImage[];
}

export interface PersonImagesResponse {
  id: number;
  profiles: TMDBImage[];
}

// Media Gallery Types
export type MediaType = 'video' | 'image';
export type ImageCategory = 'posters' | 'backdrops' | 'logos' | 'profiles';
export type MediaTab = 'videos' | ImageCategory;

export interface MediaGalleryProps {
  mediaType: 'movie' | 'tv' | 'season' | 'person';
  id: string;
  seasonNumber?: number;
  defaultTab?: MediaTab;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  language: string | null;
  voteAverage: number;
  voteCount: number;
}
```

### 2. API Endpoints Layer

**File**: `src/api/endpoints/media.endpoints.ts`

```typescript
import { tmdbApi } from '../tmdb.api';
import type { ImagesResponse, PersonImagesResponse } from '../../types/media';
import { TMDB_CONFIG } from '../../utils/constants';

export const mediaApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Movie Images
    getMovieImages: builder.query<ImagesResponse, string>({
      query: (movieId) => `/movie/${movieId}/images`,
      providesTags: (result, error, id) => [{ type: 'Media', id: `movie-${id}` }],
    }),

    // TV Show Images
    getTVImages: builder.query<ImagesResponse, string>({
      query: (tvId) => `/tv/${tvId}/images`,
      providesTags: (result, error, id) => [{ type: 'Media', id: `tv-${id}` }],
    }),

    // Season Images
    getSeasonImages: builder.query<ImagesResponse, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) => 
        `/tv/${tvId}/season/${seasonNumber}/images`,
      providesTags: (result, error, { tvId, seasonNumber }) => [
        { type: 'Media', id: `season-${tvId}-${seasonNumber}` }
      ],
    }),

    // Person Images
    getPersonImages: builder.query<PersonImagesResponse, string>({
      query: (personId) => `/person/${personId}/images`,
      providesTags: (result, error, id) => [{ type: 'Media', id: `person-${id}` }],
    }),
  }),
});

export const {
  useGetMovieImagesQuery,
  useGetTVImagesQuery,
  useGetSeasonImagesQuery,
  useGetPersonImagesQuery,
} = mediaApi;
```

### 3. Custom Hooks

**File**: `src/hooks/useMediaGallery.ts`


```typescript
import { useState, useMemo, useCallback } from 'react';
import { useGetMovieImagesQuery, useGetTVImagesQuery, useGetSeasonImagesQuery, useGetPersonImagesQuery } from '../api/endpoints/media.endpoints';
import { useGetMovieVideosQuery, useGetTVShowVideosQuery, useGetSeasonVideosQuery } from '../api/endpoints';
import type { MediaGalleryProps, MediaTab, TMDBImage } from '../types/media';
import type { Video } from '../types/videos';

interface UseMediaGalleryReturn {
  activeTab: MediaTab;
  setActiveTab: (tab: MediaTab) => void;
  availableTabs: MediaTab[];
  images: Record<string, TMDBImage[]>;
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
    if (images.posters?.length > 0) tabs.push('posters');
    if (images.backdrops?.length > 0) tabs.push('backdrops');
    if (images.logos?.length > 0) tabs.push('logos');
    if (images.profiles?.length > 0) tabs.push('profiles');
    
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
```

**File**: `src/hooks/useImageLightbox.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import type { TMDBImage } from '../types/media';

interface UseImageLightboxReturn {
  isOpen: boolean;
  currentIndex: number;
  currentImage: TMDBImage | null;
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
}

export const useImageLightbox = (images: TMDBImage[]): UseImageLightboxReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const previous = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          close();
          break;
        case 'ArrowRight':
          next();
          break;
        case 'ArrowLeft':
          previous();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, next, previous]);

  const currentImage = images[currentIndex] || null;

  return {
    isOpen,
    currentIndex,
    currentImage,
    open,
    close,
    next,
    previous,
    goTo,
  };
};
```

### 4. MediaGallery Component (Smart Container)

**File**: `src/components/MediaGallery/MediaGallery.tsx`

```typescript
import { memo } from 'react';
import { FilmIcon, PhotoIcon, RectangleStackIcon, SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useMediaGallery } from '../../hooks/useMediaGallery';
import MediaGalleryTabs from './MediaGalleryTabs';
import VideoGallery from './VideoGallery';
import ImageGallery from './ImageGallery';
import Loading from '../Loading';
import type { MediaGalleryProps, MediaTab } from '../../types/media';

const MediaGallery = memo<MediaGalleryProps>(({ mediaType, id, seasonNumber, defaultTab }) => {
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

  const tabConfig: Record<MediaTab, { icon: any; label: string; count: number }> = {
    videos: { icon: FilmIcon, label: 'Videolar', count: videos.length },
    posters: { icon: PhotoIcon, label: 'Posterler', count: images.posters?.length || 0 },
    backdrops: { icon: RectangleStackIcon, label: 'Arka Planlar', count: images.backdrops?.length || 0 },
    logos: { icon: SparklesIcon, label: 'Logolar', count: images.logos?.length || 0 },
    profiles: { icon: UserCircleIcon, label: 'Profil Fotoğrafları', count: images.profiles?.length || 0 },
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
        Medya Galerisi
      </h2>

      <MediaGalleryTabs
        tabs={availableTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabConfig={tabConfig}
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
  );
});

MediaGallery.displayName = 'MediaGallery';

export default MediaGallery;
```

### 5. ImageGallery Component

**File**: `src/components/MediaGallery/ImageGallery.tsx`


```typescript
import { memo, useState, useMemo } from 'react';
import { useImageLightbox } from '../../hooks/useImageLightbox';
import ImageCard from './ImageCard';
import ImageLightbox from './ImageLightbox';
import ImageGalleryToolbar from './ImageGalleryToolbar';
import type { TMDBImage, ImageCategory } from '../../types/media';

interface ImageGalleryProps {
  images: TMDBImage[];
  category: ImageCategory;
}

type SortOption = 'vote_average' | 'vote_count' | 'width' | 'height';
type FilterLanguage = 'all' | 'en' | 'tr' | 'null';

const ImageGallery = memo<ImageGalleryProps>(({ images, category }) => {
  const [sortBy, setSortBy] = useState<SortOption>('vote_average');
  const [filterLanguage, setFilterLanguage] = useState<FilterLanguage>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');

  const lightbox = useImageLightbox(images);

  // Filter and sort images
  const processedImages = useMemo(() => {
    let filtered = [...images];

    // Apply language filter
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(img => {
        if (filterLanguage === 'null') return img.iso_639_1 === null;
        return img.iso_639_1 === filterLanguage;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'vote_average':
          return b.vote_average - a.vote_average;
        case 'vote_count':
          return b.vote_count - a.vote_count;
        case 'width':
          return b.width - a.width;
        case 'height':
          return b.height - a.height;
        default:
          return 0;
      }
    });

    return filtered;
  }, [images, sortBy, filterLanguage]);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Bu kategori için görsel bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImageGalleryToolbar
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterLanguage={filterLanguage}
        onFilterChange={setFilterLanguage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={processedImages.length}
      />

      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' 
          : 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4'
        }
      `}>
        {processedImages.map((image, index) => (
          <ImageCard
            key={`${image.file_path}-${index}`}
            image={image}
            onClick={() => lightbox.open(index)}
            category={category}
          />
        ))}
      </div>

      <ImageLightbox
        isOpen={lightbox.isOpen}
        currentImage={lightbox.currentImage}
        currentIndex={lightbox.currentIndex}
        totalImages={processedImages.length}
        onClose={lightbox.close}
        onNext={lightbox.next}
        onPrevious={lightbox.previous}
      />
    </div>
  );
});

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;
```

### 6. ImageLightbox Component

**File**: `src/components/MediaGallery/ImageLightbox.tsx`

```typescript
import { memo, useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../../utils/image.utils';
import type { TMDBImage } from '../../types/media';

interface ImageLightboxProps {
  isOpen: boolean;
  currentImage: TMDBImage | null;
  currentIndex: number;
  totalImages: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ImageLightbox = memo<ImageLightboxProps>(({
  isOpen,
  currentImage,
  currentIndex,
  totalImages,
  onClose,
  onNext,
  onPrevious,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setIsLoading(true);
    }
  }, [isOpen, currentIndex]);

  if (!isOpen || !currentImage) return null;

  const imageUrl = getImageUrl(currentImage.file_path, 'original');

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {totalImages}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="p-2 rounded-lg bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Zoom Out"
          >
            <MagnifyingGlassMinusIcon className="h-5 w-5" />
          </button>
          <span className="text-white text-sm font-medium min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="p-2 rounded-lg bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Zoom In"
          >
            <MagnifyingGlassPlusIcon className="h-5 w-5" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      {totalImages > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors z-10"
            aria-label="Previous Image"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors z-10"
            aria-label="Next Image"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-w-full max-h-full overflow-auto">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent" />
            </div>
          )}
          <img
            src={imageUrl}
            alt="Gallery Image"
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
            onLoad={() => setIsLoading(false)}
            draggable={false}
          />
        </div>
      </div>

      {/* Footer - Image Metadata */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-6 text-sm text-slate-300">
          <span>
            {currentImage.width} × {currentImage.height}
          </span>
          <span>
            Aspect Ratio: {currentImage.aspect_ratio.toFixed(2)}
          </span>
          {currentImage.iso_639_1 && (
            <span>
              Language: {currentImage.iso_639_1.toUpperCase()}
            </span>
          )}
          {currentImage.vote_count > 0 && (
            <span>
              ⭐ {currentImage.vote_average.toFixed(1)} ({currentImage.vote_count} votes)
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ImageLightbox.displayName = 'ImageLightbox';

export default ImageLightbox;
```

## Data Models

### Image URL Utility Enhancement

**File**: `src/utils/image.utils.ts` (Enhancement)

```typescript
export type ImageSize = 
  | 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' 
  | 'h632' | 'original';

export const getImageUrl = (
  path: string | null | undefined,
  size: ImageSize = 'original'
): string => {
  if (!path) {
    return '/assets/placeholder.svg';
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Responsive image srcset generator
export const getImageSrcSet = (path: string | null | undefined): string => {
  if (!path) return '';
  
  const sizes: ImageSize[] = ['w342', 'w500', 'w780', 'original'];
  return sizes
    .map(size => `${getImageUrl(path, size)} ${size.replace(/\D/g, '')}w`)
    .join(', ');
};

// Get optimal image size based on container width
export const getOptimalImageSize = (containerWidth: number): ImageSize => {
  if (containerWidth <= 185) return 'w185';
  if (containerWidth <= 342) return 'w342';
  if (containerWidth <= 500) return 'w500';
  if (containerWidth <= 780) return 'w780';
  return 'original';
};
```

## Error Handling

### Error Boundary for Media Gallery

**File**: `src/components/MediaGallery/MediaGalleryErrorBoundary.tsx`


```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class MediaGalleryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MediaGallery Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center py-12">
          <p className="text-red-400">Medya galerisi yüklenirken bir hata oluştu.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MediaGalleryErrorBoundary;
```

## Testing Strategy

### Unit Tests

1. **Custom Hooks Tests**
   - `useMediaGallery`: Test data fetching, tab management, loading states
   - `useImageLightbox`: Test navigation, keyboard events, state management

2. **Component Tests**
   - `MediaGallery`: Test tab switching, data rendering
   - `ImageGallery`: Test filtering, sorting, grid rendering
   - `ImageLightbox`: Test zoom, navigation, keyboard shortcuts
   - `VideoGallery`: Test video selection, modal opening

3. **Utility Tests**
   - `getImageUrl`: Test URL generation for different sizes
   - `getImageSrcSet`: Test srcset generation
   - `getOptimalImageSize`: Test size selection logic

### Integration Tests

1. Test complete user flow: Page load → Tab switch → Image click → Lightbox navigation
2. Test API error handling and retry logic
3. Test responsive behavior on different screen sizes
4. Test keyboard navigation throughout the gallery

### Accessibility Tests

1. Test screen reader compatibility
2. Test keyboard-only navigation
3. Test focus management in modals
4. Test ARIA labels and roles

## Performance Optimizations

### 1. Image Loading Strategy

```typescript
// Progressive image loading
const ImageWithPlaceholder = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(getThumbnailUrl(src));

  useEffect(() => {
    const img = new Image();
    img.src = getFullSizeUrl(src);
    img.onload = () => {
      setCurrentSrc(getFullSizeUrl(src));
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-50'}`}
      {...props}
    />
  );
};
```

### 2. Virtual Scrolling for Large Galleries

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualImageGrid = ({ images }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(images.length / COLUMNS),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
    overscan: 2,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index} style={{ transform: `translateY(${virtualRow.start}px)` }}>
            {/* Render row of images */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Memoization Strategy

```typescript
// Memoize expensive computations
const sortedImages = useMemo(() => {
  return [...images].sort((a, b) => b.vote_average - a.vote_average);
}, [images]);

// Memoize callbacks
const handleImageClick = useCallback((index: number) => {
  openLightbox(index);
}, [openLightbox]);

// Memoize components
const ImageCard = memo(({ image, onClick }) => {
  // Component implementation
});
```

### 4. Code Splitting

```typescript
// Lazy load lightbox component
const ImageLightbox = lazy(() => import('./ImageLightbox'));

// Lazy load video player
const VideoModal = lazy(() => import('./VideoModal'));

// Usage with Suspense
<Suspense fallback={<Loading />}>
  {isLightboxOpen && <ImageLightbox {...props} />}
</Suspense>
```

## Responsive Design

### Breakpoint Strategy

```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};

// Grid columns per breakpoint
const gridColumns = {
  default: 2,    // Mobile portrait
  sm: 3,         // Mobile landscape
  md: 4,         // Tablet
  lg: 5,         // Desktop
  xl: 6,         // Large desktop
};
```

### Touch Gestures (Mobile)

```typescript
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => nextImage(),
  onSwipedRight: () => previousImage(),
  onSwipedDown: () => closeLightbox(),
  preventDefaultTouchmoveEvent: true,
  trackMouse: true,
});

<div {...handlers}>
  {/* Lightbox content */}
</div>
```

## Accessibility Features

### ARIA Labels and Roles

```typescript
<div role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
  <h2 id="lightbox-title" className="sr-only">Image Gallery Lightbox</h2>
  
  <button
    aria-label={`Close lightbox. Image ${currentIndex + 1} of ${totalImages}`}
    onClick={onClose}
  >
    <XMarkIcon />
  </button>
  
  <button
    aria-label="Previous image"
    onClick={onPrevious}
    disabled={currentIndex === 0}
  >
    <ChevronLeftIcon />
  </button>
  
  <img
    src={imageUrl}
    alt={`Gallery image ${currentIndex + 1} of ${totalImages}`}
    role="img"
  />
</div>
```

### Keyboard Navigation

```typescript
const keyboardShortcuts = {
  'Escape': closeLightbox,
  'ArrowLeft': previousImage,
  'ArrowRight': nextImage,
  'Home': firstImage,
  'End': lastImage,
  '+': zoomIn,
  '-': zoomOut,
  '0': resetZoom,
};
```

### Focus Management

```typescript
useEffect(() => {
  if (isOpen) {
    // Save current focus
    const previousFocus = document.activeElement as HTMLElement;
    
    // Focus first focusable element in modal
    const firstFocusable = modalRef.current?.querySelector('button');
    firstFocusable?.focus();
    
    return () => {
      // Restore focus on close
      previousFocus?.focus();
    };
  }
}, [isOpen]);
```

## Integration Points

### 1. Movie Detail Page Integration

```typescript
// src/Pages/Movies/MovieDetail.tsx
import MediaGallery from '../../components/MediaGallery/MediaGallery';

function MovieDetail() {
  // ... existing code
  
  return (
    <div>
      {/* ... existing content */}
      
      {/* Replace MovieTrailer with MediaGallery */}
      <MediaGallery
        mediaType="movie"
        id={movieId!}
        defaultTab="videos"
      />
      
      {/* ... rest of content */}
    </div>
  );
}
```

### 2. TV Detail Page Integration

```typescript
// src/Pages/Tvs/TvDetail.tsx
import MediaGallery from '../../components/MediaGallery/MediaGallery';

function TvDetail() {
  // ... existing code
  
  return (
    <div>
      {/* ... existing content */}
      
      <MediaGallery
        mediaType="tv"
        id={tvId!}
        defaultTab="videos"
      />
      
      {/* ... rest of content */}
    </div>
  );
}
```

### 3. Season Detail Page Integration

```typescript
// src/Pages/Tvs/TvSeasonDetail.tsx
import MediaGallery from '../../components/MediaGallery/MediaGallery';

function TvSeasonDetail() {
  // ... existing code
  
  return (
    <div>
      {/* ... existing content */}
      
      <MediaGallery
        mediaType="season"
        id={tvId!}
        seasonNumber={seasonNum}
        defaultTab="videos"
      />
      
      {/* ... rest of content */}
    </div>
  );
}
```

### 4. Person Detail Page Integration

```typescript
// src/Pages/Persons/PersonDetails.tsx
import MediaGallery from '../../components/MediaGallery/MediaGallery';

function PersonDetails() {
  // ... existing code
  
  return (
    <div>
      {/* ... existing content */}
      
      <MediaGallery
        mediaType="person"
        id={personId!}
        defaultTab="profiles"
      />
      
      {/* ... rest of content */}
    </div>
  );
}
```

## File Structure

```
src/
├── api/
│   └── endpoints/
│       └── media.endpoints.ts          # New: Media API endpoints
├── components/
│   └── MediaGallery/
│       ├── MediaGallery.tsx            # New: Main container
│       ├── MediaGalleryTabs.tsx        # New: Tab navigation
│       ├── MediaGalleryToolbar.tsx     # New: Filter/sort toolbar
│       ├── VideoGallery.tsx            # New: Video gallery
│       ├── ImageGallery.tsx            # New: Image gallery
│       ├── ImageCard.tsx               # New: Image card component
│       ├── ImageLightbox.tsx           # New: Lightbox modal
│       ├── VideoCard.tsx               # New: Video card component
│       ├── VideoModal.tsx              # New: Video modal
│       └── MediaGalleryErrorBoundary.tsx # New: Error boundary
├── hooks/
│   ├── useMediaGallery.ts              # New: Main gallery hook
│   ├── useImageLightbox.ts             # New: Lightbox hook
│   └── useVideoPlayer.ts               # New: Video player hook
├── types/
│   └── media.ts                        # New: Media type definitions
└── utils/
    └── image.utils.ts                  # Enhanced: Image utilities
```

## Dependencies

### New Dependencies to Install

```json
{
  "@tanstack/react-virtual": "^3.0.0",  // Virtual scrolling
  "react-swipeable": "^7.0.0"            // Touch gestures
}
```

### Existing Dependencies Used

- React 18+
- TypeScript
- RTK Query
- Tailwind CSS
- Heroicons
- React Router

## Migration Strategy

1. **Phase 1**: Create new API endpoints and types
2. **Phase 2**: Build core components (MediaGallery, ImageGallery, VideoGallery)
3. **Phase 3**: Build supporting components (Lightbox, Cards, Toolbar)
4. **Phase 4**: Create custom hooks
5. **Phase 5**: Integrate into existing pages (Movie, TV, Season, Person)
6. **Phase 6**: Testing and optimization
7. **Phase 7**: Documentation and cleanup

## Security Considerations

1. **XSS Prevention**: All user-generated content sanitized
2. **CSP Headers**: Content Security Policy for external resources
3. **HTTPS Only**: All TMDB API calls over HTTPS
4. **Rate Limiting**: Respect TMDB API rate limits
5. **Error Messages**: No sensitive information in error messages

## Monitoring and Analytics

1. **Performance Metrics**: Track image load times, gallery render times
2. **User Interactions**: Track tab switches, lightbox opens, video plays
3. **Error Tracking**: Log API errors, component errors
4. **Usage Analytics**: Track most viewed media types, popular categories
