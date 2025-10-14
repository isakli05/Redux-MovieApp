# Implementation Plan

- [x] 1. Setup type definitions and API infrastructure
  - [x] 1.1 Create comprehensive media type definitions in `src/types/media.ts`
    - Define TMDBImage, ImagesResponse, PersonImagesResponse interfaces
    - Define MediaType, ImageCategory, MediaTab type unions
    - Define MediaGalleryProps and ImageMetadata interfaces
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.3_

  - [x] 1.2 Create media API endpoints in `src/api/endpoints/media.endpoints.ts`
    - Implement getMovieImages endpoint with proper caching
    - Implement getTVImages endpoint with proper caching
    - Implement getSeasonImages endpoint with proper caching
    - Implement getPersonImages endpoint with proper caching
    - Export custom hooks for each endpoint
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 6.4, 6.5, 6.6_

  - [x] 1.3 Enhance image utility functions in `src/utils/image.utils.ts`
    - Add ImageSize type definition
    - Implement getImageUrl function with size parameter
    - Implement getImageSrcSet for responsive images
    - Implement getOptimalImageSize for container-based sizing
    - _Requirements: 1.7, 9.2, 9.3, 10.4_

  - [x] 1.4 Update RTK Query API configuration to include Media tag type
    - Add 'Media' to tag types in tmdb.api.ts
    - _Requirements: 6.1, 6.6_

- [x] 2. Build core custom hooks
  - [x] 2.1 Create useMediaGallery hook in `src/hooks/useMediaGallery.ts`
    - Implement media type detection and conditional API calls
    - Implement tab management state
    - Implement available tabs calculation based on data
    - Implement data normalization for different media types
    - Implement loading and error state aggregation
    - Export UseMediaGalleryReturn interface
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 6.2, 6.5, 7.2_

  - [x] 2.2 Create useImageLightbox hook in `src/hooks/useImageLightbox.ts`
    - Implement lightbox open/close state management
    - Implement current index tracking
    - Implement navigation functions (next, previous, goTo)
    - Implement keyboard event listeners (Arrow keys, Escape)
    - Implement body scroll lock on open
    - Export UseImageLightboxReturn interface
    - _Requirements: 1.3, 1.8, 8.2, 8.3, 8.4, 7.6_

  - [x]* 2.3 Create useVideoPlayer hook in `src/hooks/useVideoPlayer.ts`
    - Implement video modal state management
    - Implement selected video tracking
    - Implement video play/pause state
    - Export UseVideoPlayerReturn interface
    - _Requirements: 1.4_

  - [x] 2.4 Export all hooks from `src/hooks/index.ts`
    - Add exports for useMediaGallery, useImageLightbox, useVideoPlayer
    - _Requirements: 6.1_

- [x] 3. Create presentational components for images
  - [x] 3.1 Create ImageCard component in `src/components/MediaGallery/ImageCard.tsx`
    - Implement responsive image card with lazy loading
    - Add hover effects and transitions
    - Display image metadata on hover (dimensions, votes)
    - Implement onClick handler for lightbox
    - Use memo for performance optimization
    - _Requirements: 1.3, 2.4, 7.1, 7.3, 7.5, 9.1, 9.6, 10.1_

  - [x] 3.2 Create ImageGalleryToolbar component in `src/components/MediaGallery/ImageGalleryToolbar.tsx`
    - Implement sort dropdown (vote_average, vote_count, width, height)
    - Implement language filter dropdown
    - Implement view mode toggle (grid/masonry)
    - Display total count
    - Use responsive design for mobile
    - _Requirements: 7.2, 7.3, 10.1_

  - [x] 3.3 Create ImageGallery component in `src/components/MediaGallery/ImageGallery.tsx`
    - Integrate useImageLightbox hook
    - Implement filter and sort state management
    - Implement image processing logic (filter + sort)
    - Render ImageGalleryToolbar
    - Render responsive grid/masonry layout
    - Render ImageCard components with proper keys
    - Render ImageLightbox component
    - Handle empty state
    - Use memo for performance
    - _Requirements: 1.2, 1.3, 1.7, 2.2, 3.2, 5.2, 7.1, 7.2, 7.3, 9.5, 9.6, 10.1_

  - [x] 3.4 Create ImageLightbox component in `src/components/MediaGallery/ImageLightbox.tsx`
    - Implement full-screen modal overlay
    - Implement image display with zoom controls
    - Implement navigation buttons (previous/next)
    - Implement close button
    - Display image metadata in footer
    - Display current index counter
    - Implement loading state
    - Handle keyboard navigation (integrated from hook)
    - Implement zoom in/out functionality
    - Use portal for modal rendering
    - _Requirements: 1.3, 1.8, 2.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.8, 9.3, 10.3_

- [x] 4. Create presentational components for videos
  - [x] 4.1 Create VideoCard component in `src/components/MediaGallery/VideoCard.tsx`
    - Implement video thumbnail with YouTube image
    - Display video type badge (Trailer, Teaser, etc.)
    - Display official badge if applicable
    - Add play button overlay
    - Implement hover effects
    - Use memo for performance
    - _Requirements: 1.4, 7.1, 7.3, 7.5, 9.6_

  - [x] 4.2 Create VideoModal component in `src/components/MediaGallery/VideoModal.tsx`
    - Implement full-screen modal overlay
    - Embed YouTube iframe with autoplay
    - Display video metadata
    - Implement close button
    - Handle keyboard navigation (Escape to close)
    - _Requirements: 1.4, 8.3, 10.5_

  - [x] 4.3 Create VideoGallery component in `src/components/MediaGallery/VideoGallery.tsx`
    - Integrate useVideoPlayer hook
    - Implement video sorting by priority (Trailer > Teaser > Clip)
    - Render featured video (first in list) with large card
    - Render remaining videos in grid
    - Render VideoModal component
    - Handle empty state
    - Use memo for performance
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 3.4, 7.1, 9.6_

- [x] 5. Create container and orchestration components
  - [x] 5.1 Create MediaGalleryTabs component in `src/components/MediaGallery/MediaGalleryTabs.tsx`
    - Render tab buttons dynamically based on available tabs
    - Display tab icons and labels
    - Display item count per tab
    - Implement active tab highlighting
    - Handle tab click events
    - Use responsive design for mobile
    - _Requirements: 1.2, 2.2, 3.3, 5.3, 7.2, 7.3, 10.1_

  - [x] 5.2 Create MediaGalleryErrorBoundary in `src/components/MediaGallery/MediaGalleryErrorBoundary.tsx`
    - Implement React Error Boundary class component
    - Catch and log component errors
    - Display user-friendly error message
    - Provide retry button
    - _Requirements: 6.5_

  - [x] 5.3 Create MediaGallery container component in `src/components/MediaGallery/MediaGallery.tsx`
    - Integrate useMediaGallery hook
    - Implement tab state management
    - Render section header with gradient accent
    - Render MediaGalleryTabs component
    - Conditionally render VideoGallery or ImageGallery based on active tab
    - Handle loading state
    - Handle error state
    - Handle empty state (no media available)
    - Wrap in MediaGalleryErrorBoundary
    - Use memo for performance
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 2.1, 2.2, 3.1, 5.1, 6.5, 7.1, 7.2, 7.3, 7.4, 9.6_

- [x] 6. Integrate MediaGallery into existing pages
  - [x] 6.1 Integrate into Movie Detail page (`src/Pages/Movies/MovieDetail.tsx`)
    - Import MediaGallery component
    - Replace existing MovieTrailer component with MediaGallery
    - Pass mediaType="movie" and movieId
    - Set defaultTab="videos"
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 6.2 Integrate into TV Detail page (`src/Pages/Tvs/TvDetail.tsx`)
    - Import MediaGallery component
    - Replace existing TvTrailer component with MediaGallery
    - Pass mediaType="tv" and tvId
    - Set defaultTab="videos"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.3 Integrate into Season Detail page (`src/Pages/Tvs/TvSeasonDetail.tsx`)
    - Import MediaGallery component
    - Add MediaGallery below EnhancedSeasonHeader
    - Pass mediaType="season", tvId, and seasonNumber
    - Set defaultTab="videos"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.4 Integrate into Season List page (`src/Pages/Tvs/TvSeasonsList.tsx`)
    - Enhance SeasonCard component to show poster
    - Add "Watch Trailer" button if season has videos
    - Implement trailer modal on button click
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.5 Integrate into Person Detail page (`src/Pages/Persons/PersonDetails.tsx`)
    - Import MediaGallery component
    - Add MediaGallery section after person info
    - Pass mediaType="person" and personId
    - Set defaultTab="profiles"
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Implement performance optimizations
  - [x] 7.1 Add lazy loading for images
    - Implement loading="lazy" attribute on all img tags
    - Implement Intersection Observer for advanced lazy loading
    - _Requirements: 1.7, 9.1_

  - [x] 7.2 Implement progressive image loading
    - Load thumbnail first, then full resolution
    - Show loading state during transition
    - _Requirements: 9.2, 9.3_

  - [x] 7.3 Add React.memo to all presentational components
    - Wrap ImageCard, VideoCard, ImageGallery, VideoGallery with memo
    - _Requirements: 9.6_

  - [x] 7.4 Implement useMemo for expensive computations
    - Memoize sorted/filtered images
    - Memoize available tabs calculation
    - _Requirements: 9.6_

  - [x] 7.5 Implement useCallback for event handlers
    - Memoize onClick handlers
    - Memoize navigation handlers
    - _Requirements: 9.6_

- [x] 8. Implement accessibility features
  - [x] 8.1 Add ARIA labels and roles to all interactive elements
    - Add role="dialog" to modals
    - Add aria-label to buttons
    - Add aria-modal="true" to lightbox
    - _Requirements: 7.4, 8.1, 8.2, 8.3_

  - [x] 8.2 Implement focus management in modals
    - Focus first focusable element on modal open
    - Trap focus within modal
    - Restore focus on modal close
    - _Requirements: 7.4, 8.4_

  - [x] 8.3 Add keyboard navigation support
    - Arrow keys for navigation (already in useImageLightbox)
    - Escape to close modals (already in useImageLightbox)
    - Tab for focus navigation
    - _Requirements: 1.8, 8.2, 8.3_

  - [x] 8.4 Add screen reader support
    - Add sr-only text for context
    - Add descriptive alt text for images
    - Add aria-live regions for dynamic content
    - _Requirements: 7.4_

- [x] 9. Implement responsive design and mobile features
  - [x] 9.1 Add responsive grid layouts
    - Implement Tailwind responsive classes for grid columns
    - Test on mobile, tablet, desktop breakpoints
    - _Requirements: 7.3, 10.1_

  - [x] 9.2 Implement touch gestures for mobile
    - Add react-swipeable for swipe navigation in lightbox
    - Implement pinch-to-zoom for images
    - _Requirements: 8.7, 10.2_

  - [x] 9.3 Optimize for mobile performance
    - Use smaller image sizes on mobile
    - Reduce grid columns on mobile
    - Optimize touch targets (min 44x44px)
    - _Requirements: 10.1, 10.4_

  - [x] 9.4 Test full-screen lightbox on mobile
    - Ensure lightbox covers entire viewport
    - Test orientation changes
    - _Requirements: 10.3_

- [x] 10. Install required dependencies
  - [x] 10.1 Install @tanstack/react-virtual for virtual scrolling
    - Run: npm install @tanstack/react-virtual
    - _Requirements: 9.5_

  - [x] 10.2 Install react-swipeable for touch gestures
    - Run: npm install react-swipeable
    - _Requirements: 8.7, 10.2_

- [x] 11. Testing and quality assurance
  - [x]* 11.1 Write unit tests for custom hooks
    - Test useMediaGallery with different media types
    - Test useImageLightbox navigation and keyboard events
    - Test useVideoPlayer state management
    - _Requirements: 6.1, 7.1_

  - [x]* 11.2 Write component tests
    - Test MediaGallery tab switching
    - Test ImageGallery filtering and sorting
    - Test ImageLightbox zoom and navigation
    - Test VideoGallery video selection
    - _Requirements: 7.1_

  - [x]* 11.3 Write integration tests
    - Test complete user flow from page load to lightbox
    - Test API error handling
    - Test responsive behavior
    - _Requirements: 6.5_

  - [x]* 11.4 Perform accessibility audit
    - Run axe-core or similar tool
    - Test with screen reader
    - Test keyboard-only navigation
    - _Requirements: 7.4_

  - [x] 11.5 Perform manual testing across devices
    - Test on Chrome, Firefox, Safari
    - Test on iOS and Android devices
    - Test different screen sizes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Documentation and cleanup
  - [x] 12.1 Add JSDoc comments to all components and hooks
    - Document props, return types, and usage examples
    - _Requirements: 6.1, 7.1_

  - [x] 12.2 Update README with new features
    - Document MediaGallery component usage
    - Add screenshots of new gallery features
    - _Requirements: 1.1, 2.1, 3.1, 5.1_

  - [x] 12.3 Remove deprecated components if any
    - Clean up unused code
    - Update imports across the codebase
    - _Requirements: 6.1_
