/**
 * MediaGalleryErrorBoundary Component
 * Error boundary for graceful error handling in media gallery
 */

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

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center py-12 px-4">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <p className="text-red-400 text-xl font-semibold">
              Medya galerisi yüklenirken bir hata oluştu
            </p>
            <p className="text-slate-400 text-sm">
              {this.state.error?.message || 'Bilinmeyen bir hata oluştu'}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-cyan-500/30 font-semibold"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MediaGalleryErrorBoundary;
