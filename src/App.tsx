import { Route, Routes } from 'react-router-dom';
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

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Navbar />
      {/* pt-16 padding for fixed navbar */}
      <main className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/movie">
            <Route index element={<Movies />} />
            <Route path="now-playing" element={<NowPlaying />} />
            <Route path="upcoming" element={<Upcoming />} />
            <Route path=":id" element={<MovieDetail />} />
            <Route path=":id/cast" element={<MovieCast />} />
            <Route path="*" element={<Movie404 />} />
          </Route>

          <Route path="/tv">
            <Route index element={<TVs />} />
            <Route path="airing-today" element={<AiringToday />} />
            <Route path="on-the-air" element={<OnAir />} />
            <Route path=":id" element={<TvDetail />} />
            <Route
              path=":tv_id/season/:season_number"
              element={<TvSeasonDetail />}
            />
            <Route path=":tv_id/seasons" element={<TvSeasonsList />} />
            <Route path=":id/cast" element={<TvCast />} />
            <Route path="*" element={<Tv404 />} />
          </Route>

          <Route path="/Person">
            <Route index element={<Person />} />
            <Route path=":cast_id" element={<PersonDetails />} />
            <Route path="*" element={<Person404 />} />
          </Route>

          <Route path="/keyword/:key_id/movie" element={<MovieKeyList />} />
          <Route path="/keyword/:key_id/tv" element={<TvKeyList />} />
          <Route path="/network/:net_id" element={<NetworkList />} />
          <Route path="/collection/:coll_id" element={<MovieCollection />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
