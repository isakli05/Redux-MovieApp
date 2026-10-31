import { Suspense, lazy } from 'react';
import {
  Navigate,
  Outlet,
  createBrowserRouter,
  isRouteErrorResponse,
  RouterProvider,
  useLocation,
  useNavigate,
  useRouteError,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import { CinematicCursor } from './components/ui';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import { ErrorState, Skeleton } from './components/ui';
import { useSEO } from './hooks/useSEO';

// Route components are lazy-loaded so each page ships as its own chunk
// (D3: route-level code splitting; baseline was a single 825 kB bundle).
const Home = lazy(() => import('./Pages/Home'));
const Search = lazy(() => import('./Pages/Search'));
const Lists = lazy(() => import('./Pages/Lists'));
const ListsDetail = lazy(() => import('./Pages/ListsDetail'));
const Discover = lazy(() => import('./Pages/Discover'));
const AuthCallback = lazy(() => import('./Pages/AuthCallback'));
const Movies = lazy(() => import('./Pages/Movies/Movies'));
const NowPlaying = lazy(() => import('./Pages/Movies/NowPlaying'));
const Upcoming = lazy(() => import('./Pages/Movies/Upcoming'));
const MovieDetail = lazy(() => import('./Pages/Movies/MovieDetail'));
const MovieCast = lazy(() => import('./Pages/Movies/MovieCast'));
const Movie404 = lazy(() => import('./Pages/Movies/Movie404'));
const MovieKeyList = lazy(() => import('./Pages/Movies/MovieKeyList'));
const MovieCollection = lazy(() => import('./Pages/Movies/MovieCollection'));
const TVs = lazy(() => import('./Pages/Tvs/TVs'));
const AiringToday = lazy(() => import('./Pages/Tvs/AiringToday'));
const OnAir = lazy(() => import('./Pages/Tvs/OnAir'));
const TvDetail = lazy(() => import('./Pages/Tvs/TvDetail'));
const TvCast = lazy(() => import('./Pages/Tvs/TvCast'));
const Tv404 = lazy(() => import('./Pages/Tvs/Tv404'));
const TvKeyList = lazy(() => import('./Pages/Tvs/TvKeyList'));
const NetworkList = lazy(() => import('./Pages/Tvs/NetworkList'));
const TvSeasonDetail = lazy(() => import('./Pages/Tvs/TvSeasonDetail'));
const TvSeasonsList = lazy(() => import('./Pages/Tvs/TvSeasonsList'));
const Persons = lazy(() => import('./Pages/Persons/Persons'));
const PersonDetails = lazy(() => import('./Pages/Persons/PersonDetails'));
const Person404 = lazy(() => import('./Pages/Persons/Person404'));

/** Branded route-chunk fallback: Fraunces wordmark + skeleton (never a blank page). */
function RouteLoading() {
  return (
    <div
      className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 px-4"
      role="status"
      aria-live="polite"
    >
      <p className="font-display text-3xl font-semibold tracking-[0.18em] text-primary">
        LMDB<span className="text-accent">.</span>
      </p>
      <div className="w-48 space-y-2" aria-hidden="true">
        <Skeleton variant="section" className="w-40" />
        <Skeleton variant="line" />
        <Skeleton variant="line" className="w-2/3" />
      </div>
      <span className="sr-only">Sayfa yükleniyor…</span>
    </div>
  );
}

/** Shared shell: fixed Navbar + routed page + Footer. Default SEO lives here. */
function Layout() {
  useSEO({
    title: 'Film ve Dizi Keşif',
    description:
      'LMDB — filmleri, dizileri ve insanları keşfedin; puanları görün, listelerinizi yönetin.',
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-void text-primary">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        İçeriğe atla
      </a>
      <Navbar />
      {/* pt-16 offsets the fixed h-16 navbar */}
      <main id="main-content" className="flex-grow pt-16">
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CinematicCursor />
    </div>
  );
}

/** Route-level error boundary: styled with the kit's ErrorState. */
function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let message = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
  if (isRouteErrorResponse(error)) {
    message =
      error.status === 404
        ? 'Aradığınız sayfa bulunamadı.'
        : `${error.status} — ${error.statusText || 'Sunucu hatası'}`;
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface-void px-4">
      <div className="w-full max-w-lg">
        <p className="mb-6 text-center font-display text-3xl font-semibold tracking-[0.18em] text-primary">
          LMDB<span className="text-accent">.</span>
        </p>
        <ErrorState
          title="Sayfa yüklenemedi"
          message={message}
          onRetry={() => navigate(0)}
          retryLabel="Tekrar Dene"
          backTo="/"
          backLabel="Ana Sayfaya Dön"
        />
      </div>
    </div>
  );
}

/**
 * Legacy `/Person/*` URLs → lowercased `/person/*`.
 * The casing defect is fixed at the route table; this preserves old bookmarks.
 */
function LowercasePersonRedirect() {
  const { pathname } = useLocation();
  return <Navigate to={pathname.replace(/^\/Person/i, '/person')} replace />;
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <Home /> },
        { path: 'search', element: <Search /> },
        { path: 'lists', element: <Lists /> },
        { path: 'lists/:id', element: <ListsDetail /> },
        { path: 'kesfet', element: <Discover /> },
        { path: 'auth/callback', element: <AuthCallback /> },
        {
          path: 'movie',
          children: [
            { index: true, element: <Movies /> },
            { path: 'now-playing', element: <NowPlaying /> },
            { path: 'upcoming', element: <Upcoming /> },
            { path: ':id', element: <MovieDetail /> },
            { path: ':id/cast', element: <MovieCast /> },
            { path: '*', element: <Movie404 /> },
          ],
        },
        {
          path: 'tv',
          children: [
            { index: true, element: <TVs /> },
            { path: 'airing-today', element: <AiringToday /> },
            { path: 'on-the-air', element: <OnAir /> },
            { path: ':id', element: <TvDetail /> },
            { path: ':id/cast', element: <TvCast /> },
            { path: ':tv_id/seasons', element: <TvSeasonsList /> },
            { path: ':tv_id/season/:season_number', element: <TvSeasonDetail /> },
            { path: '*', element: <Tv404 /> },
          ],
        },
        {
          // Lowercased person routes (fixes route casing defect); the old
          // capitalized spelling redirects below.
          path: 'person',
          children: [
            { index: true, element: <Persons /> },
            { path: ':cast_id', element: <PersonDetails /> },
            { path: '*', element: <Person404 /> },
          ],
        },
        { path: 'Person/*', element: <LowercasePersonRedirect /> },
        { path: 'keyword/:key_id/movie', element: <MovieKeyList /> },
        { path: 'keyword/:key_id/tv', element: <TvKeyList /> },
        { path: 'network/:net_id', element: <NetworkList /> },
        { path: 'collection/:coll_id', element: <MovieCollection /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
