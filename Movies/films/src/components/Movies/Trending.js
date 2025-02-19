import React, { useContext } from "react";
import { UserContext } from "../Context";
import { Link } from "react-router-dom";
import { SkeletonMovieCard } from "../Skeleton";


export default function Trending() {
  const { trendingMovies, loading, user, preferredMovies, ratedMovies } = useContext(UserContext);

  console.log("Trending component state:", {
    isLoggedIn: !!user,
    preferredMoviesCount: preferredMovies.length,
    ratedMoviesCount: ratedMovies.length,
    trendingMoviesCount: trendingMovies.length
  });

  // Add validation checks
  if (!trendingMovies && !loading) {
    return (
      <div className="container-fluid text-center mt-5">
        <h2>Error Loading Movies</h2>
        <p>Unable to fetch movie data. Please check your connection.</p>
      </div>
    );
  }

  // Validate movie data structure
  const validateMovie = (movie) => {
    return movie && 
           movie.id && 
           movie.title && 
           movie.poster_path && 
           movie.release_date;
  };

  if (loading) {
    return (
      <div className="container-fluid mt-5">
        <div className="row ml-5 pl-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-md-1 mx-4">
              <SkeletonMovieCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const moviesToDisplay = user && preferredMovies?.length > 0 ? 
    preferredMovies.filter(validateMovie) : 
    trendingMovies.filter(validateMovie);

  if (!moviesToDisplay || moviesToDisplay.length === 0) {
    return (
      <div className="container-fluid text-center mt-5">
        <h2>No Valid Movies Available</h2>
        <p>We couldn't find any valid movies to display.</p>
      </div>
    );
  }

  // Validate rated movies
  const validRatedMovies = ratedMovies?.filter(
    (ratedMovie) => ratedMovie && ratedMovie.movie && validateMovie(ratedMovie.movie)
  ) || [];

  const formatTitle = (title) => {
    return title.replace(/\s+/g, "-");
  };

  return (
    <div className="trending-container">
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <h2 className="col-12 section-title mb-4">
            {user ? 'Your Personalized Movies' : 'Trending Now'}
          </h2>
          
          {user && validRatedMovies.map((ratedMovie) => (
            <div key={`rated-${ratedMovie.movie.id}`} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-4">
              <div className="movie-card-wrapper">
                <div className="movie-card">
                  <div className="card-inner">
                    <Link
                      to={`/movie/${ratedMovie.movie.id}/${formatTitle(ratedMovie.movie.title)}`}
                      className="movie-link"
                    >
                      <div className="poster-wrapper">
                        <img
                          src={`https://image.tmdb.org/t/p/w500${ratedMovie.movie.poster_path}`}
                          alt={ratedMovie.movie.title}
                          className="movie-poster"
                        />
                        <div className="movie-overlay">
                          <div className="movie-rating">
                            <span className="rating-badge">{ratedMovie.rating}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="movie-info">
                        <h3 className="movie-title">{ratedMovie.movie.title}</h3>
                        <p className="movie-year">{ratedMovie.movie.release_date}</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {moviesToDisplay.map((movie) => (
            <div key={`recommended-${movie.id}`} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-4">
              <div className="movie-card-wrapper">
                <div className="movie-card">
                  <div className="card-inner">
                    <Link
                      to={`/movie/${movie.id}/${formatTitle(movie.title)}`}
                      className="movie-link"
                      state={{ movie: movie }}
                    >
                      <div className="poster-wrapper">
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="movie-poster"
                        />
                        <div className="movie-overlay">
                          {movie.match_score && (
                            <div className="match-score-badge">
                              {movie.match_score}% Match
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="movie-info">
                        <h3 className="movie-title">{movie.title}</h3>
                        <p className="movie-year">{movie.release_date}</p>
                        {/* {movie.recommendation_source && (
                          <span className="recommendation-tag">
                            {movie.recommendation_source}
                          </span>
                        )} */}
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Debug panel with improved styling */}
        {user && process.env.NODE_ENV === 'development' && (
          <div className="debug-panel mt-5">
            <div className="row mt-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Debug Info</h5>
                    <p>Total Rated Movies: {ratedMovies?.length || 0}</p>
                    <p>Valid Rated Movies: {validRatedMovies.length}</p>
                    <p>Total Recommended Movies: {preferredMovies?.length || 0}</p>
                    <p>Valid Recommended Movies: {moviesToDisplay.length}</p>
                    <p>Using: {preferredMovies?.length > 0 ? 'Personalized' : 'Trending'} Movies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
