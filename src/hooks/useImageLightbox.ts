/**
 * useImageLightbox Hook
 * Manages lightbox state, navigation, and keyboard events
 */

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
        case 'Home':
          goTo(0);
          break;
        case 'End':
          goTo(images.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, next, previous, goTo, images.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
