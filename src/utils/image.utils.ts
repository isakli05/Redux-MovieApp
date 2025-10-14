/**
 * Image Utility Functions
 * Helper functions for TMDB image URLs and optimization
 */

export type ImageSize = 
  | 'w92' 
  | 'w154' 
  | 'w185' 
  | 'w300'
  | 'w342' 
  | 'w500' 
  | 'w780'
  | 'w1280'
  | 'h632' 
  | 'original';

/**
 * Get TMDB image URL with specified size
 * @param path - Image file path from TMDB API
 * @param size - Desired image size
 * @returns Full image URL or placeholder
 */
export const getImageUrl = (
  path: string | null | undefined,
  size: ImageSize = 'original'
): string => {
  if (!path) {
    return '/assets/placeholder.svg';
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

/**
 * Generate responsive image srcset for different screen sizes
 * @param path - Image file path from TMDB API
 * @returns srcset string for responsive images
 */
export const getImageSrcSet = (path: string | null | undefined): string => {
  if (!path) return '';
  
  const sizes: ImageSize[] = ['w342', 'w500', 'w780', 'original'];
  return sizes
    .map(size => {
      const width = size.replace(/\D/g, '');
      return `${getImageUrl(path, size)} ${width}w`;
    })
    .join(', ');
};

/**
 * Get optimal image size based on container width
 * @param containerWidth - Width of the container in pixels
 * @returns Optimal image size
 */
export const getOptimalImageSize = (containerWidth: number): ImageSize => {
  if (containerWidth <= 185) return 'w185';
  if (containerWidth <= 342) return 'w342';
  if (containerWidth <= 500) return 'w500';
  if (containerWidth <= 780) return 'w780';
  return 'original';
};

/**
 * Get thumbnail URL for progressive loading
 * @param path - Image file path from TMDB API
 * @returns Thumbnail URL
 */
export const getThumbnailUrl = (path: string | null | undefined): string => {
  return getImageUrl(path, 'w185');
};

/**
 * Get full size URL for final display
 * @param path - Image file path from TMDB API
 * @returns Full size URL
 */
export const getFullSizeUrl = (path: string | null | undefined): string => {
  return getImageUrl(path, 'original');
};

/**
 * Get poster URL (legacy compatibility)
 * @param path - Poster file path from TMDB API
 * @param size - Size variant ('SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL')
 * @returns Poster URL
 */
export const getPosterUrl = (
  path: string | null | undefined,
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL' = 'MEDIUM'
): string => {
  const sizeMap = {
    SMALL: 'w185' as ImageSize,
    MEDIUM: 'w342' as ImageSize,
    LARGE: 'w500' as ImageSize,
    ORIGINAL: 'original' as ImageSize,
  };
  return getImageUrl(path, sizeMap[size]);
};

/**
 * Get backdrop URL (legacy compatibility)
 * @param path - Backdrop file path from TMDB API
 * @param size - Size variant ('SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL')
 * @returns Backdrop URL
 */
export const getBackdropUrl = (
  path: string | null | undefined,
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL' = 'ORIGINAL'
): string => {
  const sizeMap = {
    SMALL: 'w300' as ImageSize,
    MEDIUM: 'w780' as ImageSize,
    LARGE: 'w1280' as ImageSize,
    ORIGINAL: 'original' as ImageSize,
  };
  return getImageUrl(path, sizeMap[size]);
};

/**
 * Get profile URL (legacy compatibility)
 * @param path - Profile file path from TMDB API
 * @param size - Size variant ('SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL')
 * @returns Profile URL
 */
export const getProfileUrl = (
  path: string | null | undefined,
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL' = 'MEDIUM'
): string => {
  const sizeMap = {
    SMALL: 'w185' as ImageSize,
    MEDIUM: 'h632' as ImageSize,
    LARGE: 'h632' as ImageSize,
    ORIGINAL: 'original' as ImageSize,
  };
  return getImageUrl(path, sizeMap[size]);
};
