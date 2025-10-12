/**
 * Infinite Scroll Hook
 * Sayfa sonuna gelindiğinde yeni sayfayı yüklemek için kullanılır
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  onLoadMore,
  isLoading,
  hasMore,
  rootMargin = '200px',
}: UseInfiniteScrollOptions) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !isLoading && hasMore) {
        onLoadMore();
      }
    },
    [onLoadMore, isLoading, hasMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin,
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver, rootMargin]);

  return observerTarget;
};

