import { Fragment, useState, useEffect } from 'react';
import { Disclosure, Menu, Transition, Dialog } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  FilmIcon,
  TvIcon,
  UserGroupIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './Search/SearchBar';
import { useAuth } from '../hooks/useAuth';

// Navigation yapısı
const navigation = {
  movies: {
    name: 'Filmler',
    icon: FilmIcon,
    items: [
      { name: 'Popüler', href: '/movie' },
      { name: 'Gösterimdekiler', href: '/movie/now-playing' },
      { name: 'Yakında', href: '/movie/upcoming' },
    ],
  },
  tv: {
    name: 'Diziler',
    icon: TvIcon,
    items: [
      { name: 'Popüler', href: '/tv' },
      { name: 'Günün Programı', href: '/tv/airing-today' },
      { name: 'Televizyonda', href: '/tv/on-the-air' },
    ],
  },
  persons: {
    name: 'Kişiler',
    icon: UserGroupIcon,
    items: [{ name: 'Popüler Kişiler', href: '/person' }],
  },
};

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Disclosure as="nav" className="fixed top-0 left-0 right-0 z-50">
      {({ open }) => (
        <>
          {/* Glassmorphism Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 shadow-lg" />

          <div className="relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Logo */}
                <div className="flex items-center">
                  <Link
                    to="/"
                    className="flex items-center gap-2 group"
                  >
                    <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2 rounded-lg shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300">
                      <FilmIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      LMDB
                    </span>
                  </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:gap-1">
                  {/* Home Link */}
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      location.pathname === '/'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <HomeIcon className="h-5 w-5" />
                    <span className="font-medium">Ana Sayfa</span>
                  </Link>

                  {/* Lists Link - v4 Yeni Özellik */}
                  <Link
                    to="/lists"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      location.pathname === '/lists'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <ListBulletIcon className="h-5 w-5" />
                    <span className="font-medium">Listelerim</span>
                  </Link>


                  {/* Movies Dropdown */}
                  <Menu as="div" className="relative">
                    <Menu.Button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        location.pathname.startsWith('/movie')
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <FilmIcon className="h-5 w-5" />
                      <span className="font-medium">{navigation.movies.name}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-xl bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                        <div className="py-1">
                          {navigation.movies.items.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <Link
                                  to={item.href}
                                  className={`block px-4 py-3 text-sm transition-colors ${
                                    isActive(item.href)
                                      ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                                      : active
                                      ? 'bg-slate-700/50 text-white'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {item.name}
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* TV Shows Dropdown */}
                  <Menu as="div" className="relative">
                    <Menu.Button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        location.pathname.startsWith('/tv')
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <TvIcon className="h-5 w-5" />
                      <span className="font-medium">{navigation.tv.name}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-xl bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                        <div className="py-1">
                          {navigation.tv.items.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <Link
                                  to={item.href}
                                  className={`block px-4 py-3 text-sm transition-colors ${
                                    isActive(item.href)
                                      ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                                      : active
                                      ? 'bg-slate-700/50 text-white'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {item.name}
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* Persons Dropdown */}
                  <Menu as="div" className="relative">
                    <Menu.Button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        location.pathname.startsWith('/person')
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <UserGroupIcon className="h-5 w-5" />
                      <span className="font-medium">{navigation.persons.name}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-xl bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                        <div className="py-1">
                          {navigation.persons.items.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <Link
                                  to={item.href}
                                  className={`block px-4 py-3 text-sm transition-colors ${
                                    isActive(item.href)
                                      ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                                      : active
                                      ? 'bg-slate-700/50 text-white'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {item.name}
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* Search Button - Desktop */}
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 group"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span className="text-sm text-gray-400">Ara...</span>
                    <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 rounded border border-slate-600 text-gray-400">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>

                  {/* Auth Section - Desktop */}
                  {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-300">
                        Merhaba, {user?.name || user?.username || 'Kullanıcı'}
                      </span>
                      <button
                        onClick={logout}
                        className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                      >
                        Çıkış
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={login}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all duration-200 text-sm font-medium"
                    >
                      Giriş Yap
                    </button>
                  )}
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden flex items-center gap-2">
                  {/* Search Button - Mobile */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 transition-colors"
                    onClick={() => setSearchOpen(true)}
                  >
                    <span className="sr-only">Arama</span>
                    <MagnifyingGlassIcon className="block h-6 w-6" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    <span className="sr-only">Menüyü aç</span>
                    {mobileMenuOpen ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu */}
            <Transition
              show={mobileMenuOpen}
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Disclosure.Panel className="md:hidden">
                <div className="space-y-1 px-4 pb-4 pt-2 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700/50">
                  {/* Home */}
                  <Link
                    to="/"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === '/'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HomeIcon className="h-5 w-5" />
                    Ana Sayfa
                  </Link>

                  {/* Lists - v4 Yeni Özellik */}
                  <Link
                    to="/lists"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === '/lists'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ListBulletIcon className="h-5 w-5" />
                    Listelerim
                  </Link>


                  {/* Movies */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 text-cyan-400 font-semibold">
                      <FilmIcon className="h-5 w-5" />
                      {navigation.movies.name}
                    </div>
                    {navigation.movies.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`block pl-12 pr-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(item.href)
                            ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                            : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* TV Shows */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 text-cyan-400 font-semibold">
                      <TvIcon className="h-5 w-5" />
                      {navigation.tv.name}
                    </div>
                    {navigation.tv.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`block pl-12 pr-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(item.href)
                            ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                            : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* Persons */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 text-cyan-400 font-semibold">
                      <UserGroupIcon className="h-5 w-5" />
                      {navigation.persons.name}
                    </div>
                    {navigation.persons.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`block pl-12 pr-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(item.href)
                            ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                            : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* Auth Section - Mobile */}
                  <div className="border-t border-slate-700/50 pt-4 mt-4">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <div className="px-3 py-2 text-sm text-gray-300">
                          Merhaba, {user?.name || user?.username || 'Kullanıcı'}
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors"
                        >
                          Çıkış Yap
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          login();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                      >
                        TMDB ile Giriş Yap
                      </button>
                    )}
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition>
          </div>

          {/* Search Modal */}
          <Transition appear show={searchOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={() => setSearchOpen(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-start justify-center p-4 pt-[8vh] sm:pt-[12vh]">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95 -translate-y-4"
                    enterTo="opacity-100 scale-100 translate-y-0"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100 translate-y-0"
                    leaveTo="opacity-0 scale-95 -translate-y-4"
                  >
                    <Dialog.Panel className="w-full max-w-4xl transform overflow-visible transition-all bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8">
                      <SearchBar onClose={() => setSearchOpen(false)} />
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}

export default Navbar;
