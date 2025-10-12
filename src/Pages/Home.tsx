import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { 
  FilmIcon, 
  TvIcon, 
  FireIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';

const Popular = React.lazy(() => import('../components/Home/Popular'));
const Free = React.lazy(() => import('../components/Home/Free'));
const Trending = React.lazy(() => import('../components/Home/Trending'));

function Home() {
  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <SparklesIcon className="h-5 w-5 text-cyan-400" />
                <span className="text-cyan-400 font-medium text-sm">
                  Film ve Dizi Keşfet
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                Milyonlarca Film ve Dizi
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Parmaklarınızın Ucunda
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Popüler filmler, trend diziler ve ücretsiz içerikler ile eğlencenin tadını çıkarın
            </p>
            
            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Link
                to="/movie"
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold text-white shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
              >
                <FilmIcon className="h-5 w-5" />
                Filmleri Keşfet
              </Link>
              <Link
                to="/tv"
                className="group flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl font-semibold text-white hover:bg-slate-700/50 transition-all duration-300 hover:scale-105"
              >
                <TvIcon className="h-5 w-5" />
                Dizileri Keşfet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-16">
        <Suspense fallback={<Loading />}>
          <Popular />
          <Trending />
          <Free />
        </Suspense>
      </div>

      {/* Stats Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center">
              <FilmIcon className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <div className="text-slate-400 font-medium">Filmler</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center">
              <TvIcon className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                30K+
              </div>
              <div className="text-slate-400 font-medium">Diziler</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center">
              <FireIcon className="h-12 w-12 mx-auto mb-4 text-purple-400" />
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                1M+
              </div>
              <div className="text-slate-400 font-medium">Kullanıcılar</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
