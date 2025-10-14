# Implementation Plan

- [x] 1. Set up TypeScript types and API endpoints
  - Create new TypeScript type definitions for season videos and credits
  - Add new API endpoints to tv.endpoints.ts for season videos and aggregate credits
  - Export new hooks for the endpoints
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 1.1 Create season videos type definition
  - Create src/types/seasonVideos.ts file
  - Define SeasonVideo interface with all required fields (id, key, name, site, type, official, published_at)
  - Define SeasonVideosResponse interface
  - _Requirements: 9.4_

- [x] 1.2 Create season credits type definition
  - Create src/types/seasonCredits.ts file
  - Define SeasonCastMember interface with roles array and total_episode_count
  - Define SeasonAggregateCreditsResponse interface
  - _Requirements: 9.4_

- [x] 1.3 Add getSeasonVideos endpoint
  - Add getSeasonVideos query to tv.endpoints.ts
  - Configure endpoint with tvId and seasonNumber parameters
  - Set up proper cache tags for invalidation
  - Export useGetSeasonVideosQuery hook
  - _Requirements: 9.1, 9.2_

- [x] 1.4 Add getSeasonAggregateCredits endpoint
  - Add getSeasonAggregateCredits query to tv.endpoints.ts
  - Configure endpoint with tvId and seasonNumber parameters
  - Set up proper cache tags for invalidation
  - Export useGetSeasonAggregateCreditsQuery hook
  - _Requirements: 9.1, 9.2_

- [x] 2. Create StatsOverview component
  - Build component to display aggregated season statistics
  - Implement stat calculations (total seasons, episodes, average rating, highest rated)
  - Create StatCard sub-component with icon, label, value, and gradient props
  - Apply glassmorphism styling and responsive grid layout
  - _Requirements: 2.1, 2.2, 5.1, 5.2_

- [x] 2.1 Implement stat calculation logic
  - Create utility functions to calculate total episodes from seasons array
  - Implement average rating calculation with proper rounding
  - Create function to find highest rated season
  - Handle edge cases (empty array, missing data)
  - _Requirements: 2.1_

- [x] 2.2 Build StatCard component
  - Create reusable StatCard component with TypeScript props
  - Implement icon rendering with Heroicons
  - Add gradient background support
  - Apply glassmorphism styling (bg-slate-800/50, backdrop-blur-lg, border)
  - Add hover effects and animations
  - _Requirements: 2.2, 5.2_

- [x] 2.3 Integrate StatsOverview into layout
  - Add StatsOverview to TvSeasonsHeader component
  - Pass seasons data as props
  - Implement responsive grid (2 cols mobile, 4 cols desktop)
  - Test with various data scenarios
  - _Requirements: 2.1, 2.2, 5.1_

- [x] 3. Create SeasonCastPreview component
  - Build component to display top cast members for a season
  - Implement overlapping circular profile images layout
  - Add tooltip on hover with actor name
  - Create "+X more" indicator for additional cast
  - Link cast images to person detail pages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Implement cast image rendering
  - Create circular profile image layout with proper sizing (40x40px)
  - Implement overlapping effect with negative margin (-space-x-2)
  - Add border styling (border-2 border-slate-800)
  - Handle missing profile images with fallback
  - _Requirements: 3.1, 3.5_

- [x] 3.2 Add hover interactions and tooltips
  - Implement hover scale effect (scale-110)
  - Add border color change on hover (border-cyan-400)
  - Create tooltip component or use title attribute for actor names
  - Ensure z-index management for hover state
  - _Requirements: 3.2_

- [x] 3.3 Create "+X more" indicator
  - Implement logic to show additional cast count
  - Create styled indicator circle matching profile image size
  - Display count text with proper styling
  - Only show when cast length exceeds maxVisible prop
  - _Requirements: 3.3_

- [x] 3.4 Add navigation to person detail pages
  - Wrap each profile image in Link component
  - Use proper person ID for routing
  - Ensure accessibility with proper aria-labels
  - _Requirements: 3.4_

- [x] 4. Create SeasonTrailerModal component
  - Build full-screen modal component for video playback
  - Implement YouTube iframe player with autoplay
  - Add close button and ESC key handler
  - Display video info (type, name, official badge)
  - Implement click-outside-to-close functionality
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 4.1 Implement modal overlay and container
  - Create fixed full-screen overlay with backdrop blur
  - Implement modal container with max-width and centering
  - Add click-outside handler to close modal
  - Prevent event propagation on modal content clicks
  - _Requirements: 6.3, 6.4_

- [x] 4.2 Add YouTube iframe player
  - Implement iframe with proper YouTube embed URL
  - Add autoplay parameter to URL
  - Set proper aspect ratio (aspect-video)
  - Configure iframe attributes (allow, allowFullScreen)
  - _Requirements: 6.3_

- [x] 4.3 Implement close functionality
  - Add close button with XMarkIcon in top-right corner
  - Implement ESC key event listener
  - Create onClose callback prop
  - Clean up event listeners on unmount
  - _Requirements: 6.4, 6.5_

- [x] 4.4 Display video information
  - Show video type badge with Turkish labels
  - Display official badge if video.official is true
  - Show video name/title
  - Apply glassmorphism styling to info section
  - _Requirements: 6.3_

- [x] 4.5 Add modal animations
  - Implement fade-in animation for overlay
  - Add scale animation for modal content
  - Create smooth exit animations
  - Use proper transition timing (duration-200, ease-out)
  - _Requirements: 10.4_

- [x] 5. Enhance SeasonCard component
  - Redesign season card with comprehensive information display
  - Add season statistics (rating, vote count, episode count, status)
  - Integrate SeasonCastPreview component
  - Add "Fragman İzle" button when videos available
  - Implement hover effects and animations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.2, 5.3_

- [x] 5.1 Update SeasonCard layout structure
  - Implement responsive layout (vertical mobile, horizontal desktop)
  - Position poster on left with proper sizing
  - Create info section with season name, stats, and overview
  - Add action buttons section at bottom
  - Apply glassmorphism card styling
  - _Requirements: 1.1, 5.1, 5.2_

- [x] 5.2 Add season statistics display
  - Display rating with StarIcon and formatted value
  - Show vote count with proper formatting
  - Display episode count with FilmIcon
  - Add air date with CalendarIcon
  - Show season status badge (Completed/Ongoing)
  - _Requirements: 1.1, 2.3_

- [x] 5.3 Integrate cast preview
  - Add SeasonCastPreview component to card
  - Pass cast data from API query
  - Position below overview text
  - Handle loading and error states
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5.4 Add trailer button
  - Create "Fragman İzle" button with PlayIcon
  - Show button only when videos data is available
  - Implement onClick handler to open modal
  - Apply proper styling (cyan accent colors)
  - _Requirements: 1.3, 6.2_

- [x] 5.5 Implement hover effects
  - Add scale transform on hover (scale-102)
  - Enhance shadow on hover (shadow-2xl shadow-cyan-500/20)
  - Add gradient overlay animation
  - Ensure smooth transitions (duration-300)
  - _Requirements: 1.2, 5.2, 10.2_

- [x] 6. Create SeasonsFilterBar component
  - Build filter and sort controls component
  - Implement sort dropdown with options (season #, rating, date, episodes)
  - Add rating slider filter (0-10 range)
  - Create status filter (All, Completed, Ongoing)
  - Add "Clear Filters" button
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6.1 Implement sort dropdown
  - Create dropdown with sort options (season_number, vote_average, air_date, episode_count)
  - Add ascending/descending toggle
  - Implement onChange handler to update sort state
  - Apply proper styling with glassmorphism
  - _Requirements: 4.2_

- [x] 6.2 Create rating filter slider
  - Implement range slider for minimum rating (0-10)
  - Display current value
  - Update filter state on change
  - Apply cyan accent colors
  - _Requirements: 4.3_

- [x] 6.3 Add status filter
  - Create filter buttons/dropdown for status (All, Completed, Ongoing)
  - Implement active state styling
  - Update filter state on selection
  - _Requirements: 4.3_

- [x] 6.4 Implement clear filters button
  - Create button to reset all filters to default
  - Show button only when filters are active
  - Display active filter count badge
  - Implement onClick handler to clear state
  - _Requirements: 4.5_

- [x] 6.5 Add responsive behavior
  - Make filter bar sticky on scroll
  - Implement mobile drawer/modal for filters
  - Use inline controls on desktop
  - Add smooth expand/collapse animations
  - _Requirements: 5.1_

- [x] 7. Implement filter and sort logic
  - Create utility functions for filtering seasons
  - Implement sorting logic for different criteria
  - Use useMemo for performance optimization
  - Handle edge cases and empty states
  - _Requirements: 4.2, 4.3, 4.4, 7.4_

- [x] 7.1 Create filter utility functions
  - Implement filterByRating function
  - Create filterByStatus function (check if season is completed)
  - Implement filterByYearRange function
  - Combine filters with AND logic
  - _Requirements: 4.3_

- [x] 7.2 Create sort utility functions
  - Implement sortBySeasonNumber function
  - Create sortByRating function
  - Implement sortByAirDate function
  - Create sortByEpisodeCount function
  - Support ascending and descending order
  - _Requirements: 4.2_

- [x] 7.3 Integrate with component state
  - Use useMemo to memoize filtered and sorted results
  - Update dependencies array properly
  - Ensure re-computation only when necessary
  - _Requirements: 7.4_

- [x] 7.4 Add smooth list animations
  - Implement fade-out/fade-in animation on filter change
  - Use CSS transitions for list reordering
  - Add stagger effect for items
  - _Requirements: 4.4, 10.3_

- [x] 8. Update TvSeasonsList page component
  - Refactor main page component to use new sub-components
  - Implement data fetching for all seasons (videos and credits)
  - Add filter and sort state management
  - Integrate modal state for video playback
  - Handle loading and error states
  - _Requirements: 1.1, 5.3, 7.1, 9.1, 9.2_

- [x] 8.1 Set up state management
  - Create state for sort configuration (sortBy, sortOrder)
  - Add state for filters (minRating, yearRange, status)
  - Implement modal state (selectedVideo)
  - Create UI state (isFilterOpen)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8.2 Implement parallel data fetching
  - Fetch TV show details (existing query)
  - Map over seasons to fetch videos for each
  - Map over seasons to fetch credits for each
  - Handle skip logic properly
  - _Requirements: 9.1, 9.2, 7.1_

- [x] 8.3 Integrate all sub-components
  - Add TvSeasonsHeader with stats
  - Include SeasonsFilterBar with state handlers
  - Render filtered and sorted season cards
  - Add SeasonTrailerModal with state
  - _Requirements: 1.1, 2.1, 4.1, 6.3_

- [x] 8.4 Implement loading states
  - Show skeleton loaders for initial load
  - Display loading indicators for season enhancements
  - Handle partial loading (some seasons loaded, others loading)
  - _Requirements: 5.3, 7.1_

- [x] 8.5 Add error handling
  - Display error banner for critical failures
  - Show retry button for failed requests
  - Implement graceful degradation for partial failures
  - Handle 404 for TV show not found
  - _Requirements: 9.5_

- [x] 9. Implement lazy loading and performance optimizations
  - Add Intersection Observer for lazy loading season enhancements
  - Implement React.memo for season cards
  - Use useMemo for expensive calculations
  - Optimize image loading with proper sizes
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9.1 Set up Intersection Observer
  - Create custom hook for intersection observer
  - Implement lazy loading for season videos/credits
  - Load first 3 seasons immediately, rest on scroll
  - Clean up observers on unmount
  - _Requirements: 7.1_

- [x] 9.2 Add React.memo to components
  - Wrap SeasonCard with React.memo
  - Memoize SeasonCastPreview component
  - Add proper comparison function if needed
  - _Requirements: 7.4_

- [x] 9.3 Optimize calculations with useMemo
  - Memoize filtered seasons calculation
  - Memoize sorted seasons calculation
  - Memoize stats calculations
  - Add proper dependency arrays
  - _Requirements: 7.4_

- [x] 9.4 Implement image optimization
  - Use appropriate TMDB image sizes (w185 for posters, w45 for profiles)
  - Add loading="lazy" to all images
  - Implement blur placeholder while loading
  - Use getPosterUrl and getProfileUrl utilities
  - _Requirements: 7.3_

- [x] 10. Add animations and micro-interactions
  - Implement staggered fade-in for season cards on page load
  - Add smooth hover animations to cards and buttons
  - Create modal open/close animations
  - Implement filter change animations
  - Add "Scroll to Top" button with fade-in
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 10.1 Create page load animations
  - Implement staggered fade-in for season cards
  - Use CSS animations or Framer Motion
  - Add delay between each card (0.1s stagger)
  - Ensure smooth entrance effect
  - _Requirements: 10.1_

- [x] 10.2 Add hover animations
  - Implement card scale and shadow on hover
  - Add button hover effects (translateY, shadow)
  - Create smooth transitions (duration-300)
  - Use cubic-bezier easing
  - _Requirements: 10.2_

- [x] 10.3 Implement filter/sort animations
  - Add fade-out/fade-in for list updates
  - Create smooth reordering animations
  - Implement exit and enter animations for items
  - _Requirements: 10.3_

- [x] 10.4 Create modal animations
  - Implement scale and opacity animation on open
  - Add smooth exit animation on close
  - Use proper timing (duration-200)
  - _Requirements: 10.4_

- [x] 10.5 Add scroll-based animations
  - Create "Scroll to Top" FAB button
  - Implement fade-in when user scrolls down
  - Add smooth scroll behavior on click
  - _Requirements: 10.6_

- [x] 11. Implement accessibility features
  - Add proper ARIA attributes to all interactive elements
  - Implement keyboard navigation support
  - Add focus indicators for all focusable elements
  - Create screen reader announcements for dynamic content
  - Ensure WCAG AA color contrast compliance
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11.1 Add ARIA attributes
  - Add role="article" to season cards
  - Implement aria-labelledby and aria-describedby
  - Add aria-label to buttons and links
  - Include aria-haspopup and aria-modal for modal
  - _Requirements: 8.4_

- [x] 11.2 Implement keyboard navigation
  - Ensure all interactive elements are focusable with Tab
  - Add ESC key handler for modal close
  - Implement focus trap in modal
  - Add skip to content link
  - _Requirements: 8.1, 8.2_

- [x] 11.3 Add focus indicators
  - Create visible focus styles for all focusable elements
  - Use outline or ring utilities
  - Ensure focus indicators have sufficient contrast
  - Test with keyboard-only navigation
  - _Requirements: 8.2_

- [x] 11.4 Implement screen reader support
  - Add live regions for filter results
  - Create loading state announcements
  - Add descriptive alt text to all images
  - Test with screen reader software
  - _Requirements: 8.3_

- [x] 11.5 Verify color contrast
  - Check all text/background combinations
  - Ensure minimum 4.5:1 ratio for normal text
  - Verify 3:1 ratio for large text
  - Test with contrast checking tools
  - _Requirements: 8.5_

- [x] 12. Create TvSeasonsHeader component
  - Build header component with show info and back button
  - Display show poster thumbnail and title
  - Add back to show detail link
  - Integrate StatsOverview component
  - Apply gradient background and glassmorphism styling
  - _Requirements: 1.1, 2.1, 5.2_

- [x] 12.1 Implement show info section
  - Display show poster thumbnail (80x120px)
  - Show title with year
  - Add back button with arrow icon
  - Link to show detail page
  - _Requirements: 1.1_

- [x] 12.2 Add gradient background
  - Implement gradient-to-b from slate-900 via slate-800
  - Add blur effect circles for visual interest
  - Position decorative elements with absolute positioning
  - _Requirements: 5.2_

- [x] 12.3 Integrate StatsOverview
  - Add StatsOverview component below show info
  - Pass seasons data as props
  - Ensure responsive layout
  - _Requirements: 2.1_

- [x] 13. Final polish and testing
  - Test all features across different browsers
  - Verify responsive behavior on various screen sizes
  - Conduct accessibility audit
  - Optimize bundle size
  - Fix any remaining bugs
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13.1 Cross-browser testing
  - Test on Chrome, Firefox, Safari, Edge
  - Verify all features work correctly
  - Check for browser-specific issues
  - Fix any compatibility problems
  - _Requirements: 5.2, 5.3_

- [x] 13.2 Responsive testing
  - Test on mobile devices (320px - 640px)
  - Verify tablet layout (640px - 1024px)
  - Check desktop experience (1024px+)
  - Ensure all breakpoints work correctly
  - _Requirements: 5.1_

- [x] 13.3 Accessibility audit
  - Run automated accessibility tests
  - Conduct manual keyboard navigation test
  - Test with screen reader
  - Verify WCAG AA compliance
  - Fix any accessibility issues
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13.4 Performance optimization
  - Analyze bundle size
  - Check for unnecessary re-renders
  - Verify image loading performance
  - Test with slow network conditions
  - Optimize where needed
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 13.5 Bug fixes and refinements
  - Fix any discovered bugs
  - Refine animations and transitions
  - Improve error handling
  - Polish UI details
  - _Requirements: 5.2, 5.3, 5.4, 5.5_
