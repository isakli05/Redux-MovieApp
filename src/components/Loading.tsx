import { FilmIcon } from '@heroicons/react/24/solid';

function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="relative">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-150" />
        </div>

        {/* Main Loading Card */}
        <div className="relative bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-12 shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            {/* Animated Film Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur-lg opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-cyan-400 to-blue-500 p-4 rounded-xl animate-bounce">
                <FilmIcon className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Yükleniyor
              </h3>
              <p className="text-slate-400 text-sm">
                İçerik hazırlanıyor...
              </p>
            </div>

            {/* Animated Dots */}
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>

            {/* Spinning Ring */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-slate-700/50 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 border-r-blue-400 rounded-full animate-spin" />
            </div>
          </div>
        </div>

        {/* Bottom Glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent blur-sm" />
      </div>
    </div>
  );
}

export default Loading;