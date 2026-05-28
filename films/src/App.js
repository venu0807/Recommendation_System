import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserProvider } from './components/Context';
import ErrorBoundary from './components/ErrorBoundary';
import Menu from './components/Menu';
import Footer from './components/Footer';

// Movie Components
import Trending from './components/Movies/Trending';
import Popular from './components/Movies/Popular';
import Upcoming from './components/Movies/Upcoming';
import Nowplaying from './components/Movies/Now_playing';
import Toprated from './components/Movies/Top_rated';
import MovieDetail from './components/Movies/MovieDetail';
import PersonComponent from './components/Movies/Person';
import PersonDetail from './components/Movies/PersonDetail';
import SearchResults from './components/Search';

// TV Show Components
import TvShow from './components/TvShow';
import TvPopular from './components/Movies/TvPopular';
import TvTopRated from './components/Movies/TvTopRated';
import TvOnAir from './components/Movies/TvOnAir';
import TvShowDetail from './components/Movies/TvShowDetail';

// Auth Components
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';

// Profile Components
import Profile from './components/Profile/Profile';
import EditProfile from './components/Profile/EditProfile';
import Watchlist from './components/Profile/Watchlist';
import Favorites from './components/Profile/Favorites';

// Other Components
import Notifications from './components/Notifications';
import ProgressBar from './components/ProgressBar';
import Settings from './components/Settings';
import HomePage from './components/HomePage';
import NotFound from './components/NotFound';

function App() {
    return (
        <ErrorBoundary>
            <UserProvider>
                <div className="app-container">
                    <ProgressBar />
                    <Notifications />
                    <Menu />
                    
                    <main className="main-content">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/movies" element={<Popular />} />
                            <Route path="/movies/upcoming" element={<Upcoming />} />
                            <Route path="/movies/now-playing" element={<Nowplaying />} />
                            <Route path="/movies/top-rated" element={<Toprated />} />
                            <Route path="/movies/trending" element={<Trending />} />
                            <Route path="/movie/:id/:movieTitle" element={<MovieDetail />} />
                            <Route path="/movie/:id/:movieTitle/cast" element={<PersonComponent />} />
                            <Route path="/person/:id/:personName" element={<PersonDetail />} />
                            <Route path="/search" element={<SearchResults />} />
                            <Route path="/tv" element={<TvShow />} />
                            <Route path="/tv/popular" element={<TvPopular />} />
                            <Route path="/tv/top-rated" element={<TvTopRated />} />
                            <Route path="/tv/on-air" element={<TvOnAir />} />
                            <Route path="/tv/:id/:name" element={<TvShowDetail />} />
                            
                            {/* Protected Routes */}
                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            } />
                            <Route path="/profile/edit" element={
                                <PrivateRoute>
                                    <EditProfile />
                                </PrivateRoute>
                            } />
                            <Route path="/watchlist" element={
                                <PrivateRoute>
                                    <Watchlist />
                                </PrivateRoute>
                            } />
                            <Route path="/favorites" element={
                                <PrivateRoute>
                                    <Favorites />
                                </PrivateRoute>
                            } />
                            <Route path="/settings" element={
                                <PrivateRoute>
                                    <Settings />
                                </PrivateRoute>
                            } />
                            
                            {/* 404 Route */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                    
                    <Footer />
                </div>
            </UserProvider>
        </ErrorBoundary>
    );
}

export default App;
