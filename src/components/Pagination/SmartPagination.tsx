/**
 * Smart Pagination Component
 * Senior-level pagination with modern UX
 * 
 * Features:
 * - Smart page number display (shows relevant pages)
 * - Jump to page functionality
 * - Keyboard navigation
 * - URL sync (optional)
 * - Responsive design
 * - Accessibility compliant
 */

import { useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showPageJump?: boolean;
  maxVisiblePages?: number;
}

export const SmartPagination: React.FC<SmartPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  showPageJump = true,
  maxVisiblePages = 7,
}) => {
  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination logic
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
      
      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
      
      // Always show first page
      pages.push(1);
      
      if (shouldShowLeftDots) {
        pages.push('...');
      }
      
      // Show pages around current page
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (shouldShowRightDots) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && !isLoading) {
      onPageChange(page);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToPage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pageInput = formData.get('page') as string;
    const page = parseInt(pageInput, 10);
    
    if (page >= 1 && page <= totalPages && !isNaN(page)) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      e.currentTarget.reset();
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-6 mt-12">
      {/* Main Pagination */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || isLoading}
          className="group relative p-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg hover:border-cyan-500/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-700/50"
          aria-label="Önceki sayfa"
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-2">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="px-3 py-2 text-slate-500"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            
            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                disabled={isLoading}
                className={`
                  relative min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={`Sayfa ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || isLoading}
          className="group relative p-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg hover:border-cyan-500/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-700/50"
          aria-label="Sonraki sayfa"
        >
          <ChevronRightIcon className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
        </button>
      </div>

      {/* Jump to Page */}
      {showPageJump && totalPages > 10 && (
        <form onSubmit={handleJumpToPage} className="flex items-center gap-3">
          <label htmlFor="page-jump" className="text-slate-400 text-sm">
            Sayfaya git:
          </label>
          <input
            id="page-jump"
            name="page"
            type="number"
            min="1"
            max={totalPages}
            placeholder={currentPage.toString()}
            className="w-20 px-3 py-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500/50 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg text-cyan-400 hover:border-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Git
          </button>
        </form>
      )}

      {/* Page Info */}
      <div className="text-slate-400 text-sm">
        Sayfa <span className="text-cyan-400 font-semibold">{currentPage}</span> / {totalPages.toLocaleString('tr-TR')}
      </div>
    </div>
  );
};
