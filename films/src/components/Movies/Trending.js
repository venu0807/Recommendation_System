import React, { useContext } from "react";
import { UserContext } from "../Context";
import { Link } from "react-router-dom";
import { SkeletonMovieCard } from "../Skeleton";

export default function Trending() {
  const { trendingMovies, loading, user, preferredMovies, ratedMovies, recommendationLoading } = useContext(UserContext);

  console.log("Trending component state:", {
    isLoggedIn: !!user,
    preferredMoviesCount: preferredMovies.length,
    ratedMoviesCount: ratedMovies.length,
    trendingMoviesCount: trendingMovies.length
  });

  if (loading || recommendationLoading) {
    return (
      <div className="container-fluid mt-5">
        <div className="row ml-5 pl-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-md-1 mx-4">
              <SkeletonMovieCard />
            </div>
          ))}
        </div>
        {recommendationLoading && (
          <div className="text-center mt-3">
            <span className="spinner-border text-primary" role="status" aria-hidden="true"></span>
            <span className="ml-2">Updating recommendations...</span>
          </div>
        )}
      </div>
    );
  }

  // Show trending movies if user has no recommended (preferred) movies
  const moviesToDisplay = user && preferredMovies && preferredMovies.length > 0 ? preferredMovies : trendingMovies;

  if (!moviesToDisplay || moviesToDisplay.length === 0) {
    return (
      <div className="container-fluid text-center mt-5">
        <h2>No movies available</h2>
        <p>Please try again later</p>
      </div>
    );
  }

  const formatTitle = (title) => {
    return title.replace(/\s+/g, "-");
  };

  return (
    <div>
      <div className="container-fluid mt-5">
        <div className="row ml-5 pl-5">
          <h2 className="col-12 mb-4">
            {user ? 'Your Movies' : 'Trending Movies'}
          </h2>
          {user && ratedMovies && ratedMovies.map((ratedMovie) => (
            <div key={`rated-${ratedMovie.movie.id}`} className="col-md-1 mx-4">
              <div className="card movie-card mb-3">
                <Link
                  to={`/movie/${ratedMovie.movie.id}/${formatTitle(ratedMovie.movie.title)}`}
                  className="link"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${ratedMovie.movie.poster_path}`}
                    alt={ratedMovie.movie.title}
                    className="card-img-top"
                  />
                  <div className="card-body">
                    <b className="card-title text-dark">{ratedMovie.movie.title}</b>
                    <b className="card-title text-dark">{ratedMovie.movie.release_date}</b>
                    <p className="rating-info text-dark">Your Rating: {ratedMovie.rating}/10</p>
                  </div>
                </Link>
              </div>
            </div>
          ))}
          {moviesToDisplay.map((movie) => (
            <div key={`recommended-${movie.id}`} className="col-md-1 mx-4">
              <div className="card movie-card mb-3">
                <Link
                  to={`/movie/${movie.id}/${formatTitle(movie.title)}`}
                  className="link"
                  state={{ movie: movie }} // Add this line to pass movie data
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="card-img-top"
                  />
                  <div className="card-body">
                    <b className="card-title text-dark">{movie.title}</b>
                    <div className="card-bottom">
                      <b className="card-title text-dark">{movie.release_date}</b>
                    </div>
                    {/* {movie.recommendation_source && (
                      <div className="recommendation-details">
                        {movie.match_score && (
                          <p className="match-score">Match Score: {movie.match_score}%</p>
                        )}
                      </div>
                    )} */}
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Debug Information (only visible when logged in) */}
        {user && process.env.NODE_ENV === 'development' && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Debug Info</h5>
                  <p>Rated Movies: {ratedMovies.length}</p>
                  <p>Recommended Movies: {preferredMovies.length}</p>
                  <p>Using: {preferredMovies.length > 0 ? 'Personalized' : 'Trending'} Movies</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
