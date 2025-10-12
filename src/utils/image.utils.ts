import { TMDB_CONFIG, IMAGE_SIZES, DEFAULT_IMAGES } from './constants';

/**
 * TMDB resim URL'i oluşturur
 * @param path - Resim path'i (örn: /abc123.jpg)
 * @param size - Resim boyutu (opsiyonel, default: original)
 * @param type - Resim tipi (poster, backdrop, profile)
 * @returns Tam resim URL'i veya fallback
 */
export const getImageUrl = (
  path: string | null | undefined,
  size: string = 'original',
  type: 'poster' | 'backdrop' | 'profile' = 'poster'
): string => {
  if (!path) {
    return type === 'profile' ? DEFAULT_IMAGES.PROFILE : DEFAULT_IMAGES.POSTER;
  }

  return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
};

/**
 * Poster resmi için URL oluşturur
 */
export const getPosterUrl = (
  path: string | null | undefined,
  size: keyof typeof IMAGE_SIZES.POSTER = 'ORIGINAL'
): string => {
  return getImageUrl(path, IMAGE_SIZES.POSTER[size], 'poster');
};

/**
 * Backdrop resmi için URL oluşturur
 */
export const getBackdropUrl = (
  path: string | null | undefined,
  size: keyof typeof IMAGE_SIZES.BACKDROP = 'ORIGINAL'
): string => {
  return getImageUrl(path, IMAGE_SIZES.BACKDROP[size], 'backdrop');
};

/**
 * Profile resmi için URL oluşturur
 */
export const getProfileUrl = (
  path: string | null | undefined,
  size: keyof typeof IMAGE_SIZES.PROFILE = 'ORIGINAL'
): string => {
  return getImageUrl(path, IMAGE_SIZES.PROFILE[size], 'profile');
};

