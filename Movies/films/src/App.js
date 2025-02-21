import React from 'react';
import Menu from './components/Menu';
import { Routes, Route } from 'react-router-dom';
import Trending from './components/Movies/Trending';
import Popular from './components/Movies/Popular';
import Upcoming from './components/Movies/Upcoming';
import Nowplaying from './components/Movies/Now_playing';
import Toprated from './components/Movies/Top_rated';
import MovieDetail from './components/Movies/MovieDetail';
import PersonComponent from './components/Movies/Person';
import PersonDetail from './components/Movies/PersonDetail';
import SearchResults from './components/Search';
import TvShow from './components/TvShow';
import Login from './components/Login';
import Register from './components/Register';
import Notifications from './components/Notifications';
import ProgressBar from './components/ProgressBar';
import Profile from './components/Profile/Profile';
import Watchlist from './components/Profile/Watchlist';
import Favorites from './components/Profile/Favorites';
import Settings from './components/Settings';

function App() {
    return (
        <div className="app-container">
            <ProgressBar />
            <Notifications />
            <Menu />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Trending />} />
                    <Route path="/movie" element={<Popular />} />
                    <Route path="/movie/upcoming" element={<Upcoming />} />
                    <Route path="/movie/now-playing" element={<Nowplaying />} />
                    <Route path="/movie/top-rated" element={<Toprated />} />
                    <Route path="/movie/:id/:movieTitle" element={<MovieDetail />} />
                    <Route path="/movie/:id/:movieTitle/cast" element={<PersonComponent />} />
                    <Route path="/person/:id/:personName" element={<PersonDetail />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/tv" element={<TvShow />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;