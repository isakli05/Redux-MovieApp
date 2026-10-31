import { Fragment, useEffect, useState } from 'react';
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, NavLink } from 'react-router-dom';
import SearchBar from './Search/SearchBar';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui';

/**
 * Shell navbar — Cinematic Atlas spec §6.
 * Transparent at rest, `glass-bar` after 8px of scroll (the only glass surface
 * besides media controls, spec §3). Search keeps the app's existing mechanism:
 * the navbar owns a Cmd/Ctrl+K listener and hosts the untouched SearchBar
 * combobox inside a dialog.
 */

const NAV_LINKS = [
  { to: '/kesfet', label: 'Keşfet', end: true },
  { to: '/movie', label: 'Filmler', end: false },
  { to: '/tv', label: 'Diziler', end: false },
  { to: '/person', label: 'İnsanlar', end: false },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void';

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '');

function Wordmark() {
  return (
    <Link
      to="/"
      aria-label="LMDB — ana sayfa"
      className={`font-display text-2xl font-semibold tracking-[0.18em] text-primary transition-colors duration-250 hover:text-accent ${FOCUS_RING} rounded-sm px-1`}
    >
      LMDB<span className="text-accent">.</span>
    </Link>
  );
}

function SearchTrigger({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Arama aç"
      className={`group ${
        compact
          ? 'inline-flex h-10 w-10 items-center justify-center rounded-md text-secondary hover:bg-surface-overlay hover:text-primary'
          : 'hidden h-9 items-center gap-2.5 rounded-md border border-line-strong px-3 text-sm text-secondary hover:border-accent hover:text-primary md:inline-flex'
      } ${FOCUS_RING}`}
    >
      <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
      {!compact && (
        <>
          <span>Ara…</span>
          <kbd className="rounded border border-line bg-surface-overlay px-1.5 py-0.5 text-[0.688rem] leading-none text-muted">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </>
      )}
    </button>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();

  // Transparent at rest → glass-bar once the page scrolls past 8px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Global Cmd/Ctrl + K — the app's existing search shortcut.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setDrawerOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Body scroll lock while a shell dialog is open (belt-and-braces on top of
  // Headless UI's built-in scroll locking).
  useEffect(() => {
    const locked = searchOpen || drawerOpen;
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [searchOpen, drawerOpen]);

  const displayName = user?.name || user?.username || 'Kullanıcı';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'K';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${FOCUS_RING} ${
      isActive ? 'text-accent' : 'text-secondary hover:text-primary'
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-250 ease-cine ${
        scrolled ? 'glass-bar border-b border-line' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Wordmark />

        {/* Center links — desktop */}
        <nav aria-label="Ana gezinme" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className={linkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right cluster — desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <SearchTrigger onClick={() => setSearchOpen(true)} />

          {isAuthenticated ? (
            <Menu as="div" className="relative">
              <MenuButton
                aria-label={`Hesap menüsü — ${displayName}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-line-strong text-sm font-semibold text-accent transition-colors duration-150 hover:border-accent ${FOCUS_RING}`}
              >
                {initial}
              </MenuButton>
              <Transition
                as={Fragment}
                enter="transition ease-cine duration-150"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-cine duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 mt-2 w-52 rounded-lg border border-line bg-surface-raised py-1 shadow-cine focus:outline-none">
                  <div className="border-b border-line px-3 py-2">
                    <p className="text-sm font-medium text-primary">{displayName}</p>
                    <p className="text-xs uppercase tracking-[0.08em] text-muted">TMDB hesabı</p>
                  </div>
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to="/lists"
                        className={`block px-3 py-2 text-sm ${
                          focus ? 'bg-surface-overlay text-primary' : 'text-secondary'
                        }`}
                      >
                        Listelerim
                      </Link>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={logout}
                        className={`block w-full px-3 py-2 text-left text-sm ${
                          focus ? 'bg-surface-overlay text-primary' : 'text-secondary'
                        }`}
                      >
                        Çıkış Yap
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          ) : (
            <Button size="sm" onClick={login}>
              Giriş Yap
            </Button>
          )}
        </div>

        {/* Right cluster — mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <SearchTrigger onClick={() => setSearchOpen(true)} compact />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menüyü aç"
            aria-expanded={drawerOpen}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-secondary hover:bg-surface-overlay hover:text-primary ${FOCUS_RING}`}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer — full-screen; Dialog supplies the focus trap, Escape
          handling and scroll lock. */}
      <Transition show={drawerOpen} as={Fragment}>
        <Dialog onClose={() => setDrawerOpen(false)} className="relative z-[60] md:hidden">
          <TransitionChild
            as={Fragment}
            enter="transition ease-cine duration-250"
            enterFrom="transform opacity-0 translate-x-4"
            enterTo="transform opacity-100 translate-x-0"
            leave="transition ease-cine duration-150"
            leaveFrom="transform opacity-100 translate-x-0"
            leaveTo="transform opacity-0 translate-x-4"
          >
            <DialogPanel className="fixed inset-0 flex flex-col bg-surface-void focus:outline-none">
              <div className="flex h-16 items-center justify-between px-4">
                <Wordmark />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Menüyü kapat"
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-secondary hover:bg-surface-overlay hover:text-primary ${FOCUS_RING}`}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobil gezinme" className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-3 font-display text-xl ${
                        isActive ? 'text-accent' : 'text-primary hover:bg-surface-overlay'
                      } ${FOCUS_RING}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/lists"
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-3 font-display text-xl ${
                      isActive ? 'text-accent' : 'text-primary hover:bg-surface-overlay'
                    } ${FOCUS_RING}`
                  }
                >
                  Listelerim
                </NavLink>
              </nav>

              <div className="border-t border-line px-4 py-4">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-secondary">{displayName}</span>
                    <Button variant="outline" size="sm" onClick={logout}>
                      Çıkış Yap
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setDrawerOpen(false);
                      login();
                    }}
                  >
                    Giriş Yap
                  </Button>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {/* Search dialog — hosts the existing SearchBar combobox (unmodified). */}
      <Transition show={searchOpen} as={Fragment}>
        <Dialog onClose={() => setSearchOpen(false)} className="relative z-[70]">
          <TransitionChild
            as={Fragment}
            enter="transition ease-cine duration-250"
            enterFrom="transform opacity-0 -translate-y-2"
            enterTo="transform opacity-100 translate-y-0"
            leave="transition ease-cine duration-150"
            leaveFrom="transform opacity-100 translate-y-0"
            leaveTo="transform opacity-0 -translate-y-2"
          >
            <DialogPanel className="fixed inset-x-0 top-0 mx-auto mt-[8vh] w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-line bg-surface-raised p-4 shadow-cine focus:outline-none sm:p-6">
              <SearchBar onClose={() => setSearchOpen(false)} />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </header>
  );
}

export default Navbar;
