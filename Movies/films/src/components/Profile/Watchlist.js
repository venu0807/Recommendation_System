import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../Context";
import { Link, useNavigate } from "react-router-dom";
import { SkeletonMovieCard } from "../Skeleton";

const Watchlist = () => {
  const { watchlist, loading, user, authTokens, setWatchlist } = useContext(UserContext);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const refreshWatchlist = async () => {
    if (!authTokens) return;
    setIsUpdating(true);
    try {
      const response = await fetch("http://localhost:8000/watchlist/my_watchlist/", {
        headers: {
          'Authorization': `Bearer ${authTokens.access}`,
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (error) {
      console.error("Error refreshing watchlist:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      refreshWatchlist();
    }
  }, [user, navigate]);

  if (loading || isUpdating) {
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

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="container-fluid mt-5 profile-page">
        <h2 className="profile-heading">Your Watchlist</h2>
        <p className="text-center mt-4">No movies in watchlist yet.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5 profile-page">
      <h2 className="profile-heading">Your Watchlist</h2>
      <div className="row ml-5 pl-5">
        {watchlist.map((item) => (
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
      </div>
    </div>
  );
};

export default Watchlist;