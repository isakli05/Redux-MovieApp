import { Link } from 'react-router-dom';
import { 
  FilmIcon, 
  HeartIcon, 
  EnvelopeIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Decorative Orbs */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative">
        {/* Top Wave Border */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 group w-fit">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2 rounded-lg shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300 group-hover:scale-110">
                  <FilmIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  LMDB
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                Film ve dizi dünyasına açılan kapınız. Milyonlarca içerik keşfedin, 
                favorilerinizi bulun ve eğlenceye dalın.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <HeartIcon className="h-4 w-4 text-red-400 animate-pulse" />
                <span>Film tutkunları için yapıldı</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-cyan-400" />
                Hızlı Erişim
              </h3>
              <nav className="grid grid-cols-2 gap-2">
                <Link 
                  to="/movie" 
                  className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 text-sm group flex items-center gap-1"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-cyan-400 transition-all duration-200" />
                  Filmler
                </Link>
                <Link 
                  to="/tv" 
                  className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 text-sm group flex items-center gap-1"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-cyan-400 transition-all duration-200" />
                  Diziler
                </Link>
                <Link 
                  to="/person" 
                  className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 text-sm group flex items-center gap-1"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-cyan-400 transition-all duration-200" />
                  Kişiler
                </Link>
                <Link 
                  to="/movie/upcoming" 
                  className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 text-sm group flex items-center gap-1"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-cyan-400 transition-all duration-200" />
                  Yakında
                </Link>
              </nav>
            </div>

            {/* Contact & Social */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <EnvelopeIcon className="h-5 w-5 text-cyan-400" />
                İletişim
              </h3>
              <div className="flex gap-3">
                <a
                  href="https://github.com/isakli05"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative w-10 h-10 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg flex items-center justify-center hover:border-purple-500/50 transition-colors duration-300">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/in/isa-kaya-187653171/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative w-10 h-10 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg flex items-center justify-center hover:border-blue-500/50 transition-colors duration-300">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                </a>
              </div>
              <p className="text-xs text-slate-500 pt-4">
                Bu site TMDB API kullanmaktadır ancak TMDB tarafından onaylanmamıştır veya sertifikalandırılmamıştır.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                © {currentYear} <span className="text-cyan-400 font-semibold">İSA KAYA</span>. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Tasarlandı ve geliştirildi</span>
                <HeartIcon className="h-4 w-4 text-red-400" />
                <span>ile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;