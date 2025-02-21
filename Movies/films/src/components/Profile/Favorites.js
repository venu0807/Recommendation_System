import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../Context";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SkeletonMovieCard } from '../Skeleton';  // Updated import path

const Favorites = () => {
  const { favorites, loading, user, authTokens, setFavorites } = useContext(UserContext);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const refreshFavorites = async () => {
    if (!authTokens) return;
    setIsUpdating(true);
    try {
      const response = await fetch("http://localhost:8000/favorites/my_favorites/", {
        headers: {
          'Authorization': `Bearer ${authTokens.access}`,
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error refreshing favorites:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      refreshFavorites();
    }
  }, [user, navigate]);

  // Add this console.log to debug
  useEffect(() => {
    console.log("Current favorites:", favorites);
  }, [favorites]);

  if (loading || isUpdating) {
    return (
      <div className="container mt-5">
        <h2 className="profile-heading">Your Favorites</h2>
        <div className="row">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-md-2 mb-4">
              <SkeletonMovieCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="container-fluid mt-5 profile-page">
        <h2 className="profile-heading">Your Favorite Movies</h2>
        <p className="text-center mt-4">No favorite movies yet.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5 profile-page">
      <h2 className="profile-heading">Your Favorite Movies</h2>
      <div className="row ml-5 pl-5">
        {favorites.map((fav) => (
          <div key={fav.movie.id} className="col-md-3">
            <div className="card movie-card mb-3 profile-movie-card">
              <Link
                to={`/movie/${fav.movie.id}/${fav.movie.title.replace(
                  /\s+/g,
                  "-"
                )}`}
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
        {favorites.length === 0 && (
          <p className="no-items-message">No favorite movies yet.</p>
        )}
      </div>
    </div>
  );
};

export default Favorites;
