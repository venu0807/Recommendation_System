import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../Context';
import { Link } from 'react-router-dom';
import { SkeletonMovieCard } from '../Skeleton';

const Favorites = () => {
  const { favorites, loading } = useContext(UserContext);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  useEffect(() => {
    if (favorites) {
      setFavoriteMovies(favorites);
    }
  }, [favorites]);

  if (loading) {
    return (
      <div className="container-fluid mt-5 profile-page">
        <h2 className="profile-heading">Your Favorite Movies</h2>
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
      <h2 className="profile-heading">Your Favorite Movies</h2>
      <div className="row ml-5 pl-5">
        {favoriteMovies.map((fav) => (
          <div key={fav.movie.id} className="col-md-3">
            <div className="card movie-card mb-3 profile-movie-card">
              <Link
                to={`/movie/${fav.movie.id}/${fav.movie.title.replace(/\s+/g, "-")}`}
                className="link"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${fav.movie.poster_path}`}
                  alt={fav.movie.title}
                  className="card-img-top profile-movie-image"
                />
                <div className="card-body">
                  <b className="card-title text-dark">{fav.movie.title}</b>
                </div>
              </Link>
            </div>
          </div>
        ))}
        {favoriteMovies.length === 0 && (
          <p className="no-items-message">No favorite movies yet.</p>
        )}
      </div>
    </div>
  );
};

export default Favorites; 