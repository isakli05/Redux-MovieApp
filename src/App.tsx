import { Route, Routes, createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Home from './Pages/Home';
import Movies from './Pages/Movies/Movies';
import Person from './Pages/Persons/Persons';
import TVs from './Pages/Tvs/TVs';
import NotFound from './components/NotFound';
import Upcoming from './Pages/Movies/Upcoming';
import NowPlaying from './Pages/Movies/NowPlaying';
import AiringToday from './Pages/Tvs/AiringToday';
import OnAir from './Pages/Tvs/OnAir';
import Movie404 from './Pages/Movies/Movie404';
import Tv404 from './Pages/Tvs/Tv404';
import Footer from './components/Footer';
import MovieDetail from './Pages/Movies/MovieDetail';
import PersonDetails from './Pages/Persons/PersonDetails';
import Person404 from './Pages/Persons/Person404';
import MovieCast from './Pages/Movies/MovieCast';
import MovieKeyList from './Pages/Movies/MovieKeyList';
import MovieCollection from './Pages/Movies/MovieCollection';
import TvDetail from './Pages/Tvs/TvDetail';
import NetworkList from './Pages/Tvs/NetworkList';
import TvCast from './Pages/Tvs/TvCast';
import TvKeyList from './Pages/Tvs/TvKeyList';
import TvSeasonDetail from './Pages/Tvs/TvSeasonDetail';
import TvSeasonsList from './Pages/Tvs/TvSeasonsList';
import Navbar from './components/Navbar';
import Search from './Pages/Search';
import Lists from './Pages/Lists';
import AuthCallback from './Pages/AuthCallback';

// Layout component for shared UI
function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Navbar />
      {/* pt-16 padding for fixed navbar */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Create router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "search",
        element: <Search />
      },
      {
        path: "lists",
        element: <Lists />
      },
      {
        path: "auth/callback",
        element: <AuthCallback />
      },
      {
        path: "movie",
        children: [
          {
            index: true,
            element: <Movies />
          },
          {
            path: "now-playing",
            element: <NowPlaying />
          },
          {
            path: "upcoming",
            element: <Upcoming />
          },
          {
            path: ":id",
            element: <MovieDetail />
          },
          {
            path: ":id/cast",
            element: <MovieCast />
          },
          {
            path: "*",
            element: <Movie404 />
          }
        ]
      },
      {
        path: "tv",
        children: [
          {
            index: true,
            element: <TVs />
          },
          {
            path: "airing-today",
            element: <AiringToday />
          },
          {
            path: "on-the-air",
            element: <OnAir />
          },
          {
            path: ":id",
            element: <TvDetail />
          },
          {
            path: ":tv_id/season/:season_number",
            element: <TvSeasonDetail />
          },
          {
            path: ":tv_id/seasons",
            element: <TvSeasonsList />
          },
          {
            path: ":id/cast",
            element: <TvCast />
          },
          {
            path: "*",
            element: <Tv404 />
          }
        ]
      },
      {
        path: "Person",
        children: [
          {
            index: true,
            element: <Person />
          },
          {
            path: ":cast_id",
            element: <PersonDetails />
          },
          {
            path: "*",
            element: <Person404 />
          }
        ]
      },
      {
        path: "keyword/:key_id/movie",
        element: <MovieKeyList />
      },
      {
        path: "keyword/:key_id/tv",
        element: <TvKeyList />
      },
      {
        path: "network/:net_id",
        element: <NetworkList />
      },
      {
        path: "collection/:coll_id",
        element: <MovieCollection />
      },
      {
        path: "*",
        element: <NotFound />
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return <RouterProvider router={router} />;
}

export default App;
