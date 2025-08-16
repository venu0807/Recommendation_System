import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../Context';
import { Link } from 'react-router-dom';
import { SkeletonMovieCard } from '../Skeleton';


const Watchlist = () => {
  const { watchlist, loading } = useContext(UserContext);
  const [watchlistMovies, setWatchlistMovies] = useState([]);

  useEffect(() => {
    if (watchlist) {
      setWatchlistMovies(watchlist);
    }
  }, [watchlist]);

  if (loading) {
    return (
      <div className="container-fluid mt-5 profile-page">
        <h2 className="profile-heading">Your Watchlist</h2>
        <div className="row ml-5 pl-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-md-3 mx-4">
              <SkeletonMovieCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5 profile-page">
      <h2 className="profile-heading">Your Watchlist</h2>
      <div className="row ml-5 pl-5">
        {watchlistMovies.map((item) => (
          <div key={item.movie.id} className="col-md-3">
            <div className="card movie-card mb-3 profile-movie-card">
              <Link
                to={`/movie/${item.movie.id}/${item.movie.title.replace(/\s+/g, "-")}`}
                className="link"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.movie.poster_path}`}
                  alt={item.movie.title}
                  className="card-img-top profile-movie-image"
                />
                <div className="card-body">
                  <b className="card-title text-dark">{item.movie.title}</b>
                </div>
              </Link>
            </div>
          </div>
        ))}
        {watchlistMovies.length === 0 && (
          <p className="no-items-message">No movies in your watchlist yet.</p>
        )}
      </div>
    </div>
  );
};

export default Watchlist; 