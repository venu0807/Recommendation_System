import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from './Context';
import { Link } from 'react-router-dom';
import { SkeletonMovieCard } from './Skeleton';

const HomePage = () => {
  const { 
    trendingMovies, 
    upcomingMovies, 
    topratedMovies, 
    preferredMovies, 
    user, 
    loading 
  } = useContext(UserContext);

  const [heroMovie, setHeroMovie] = useState(null);

  useEffect(() => {
    if (trendingMovies.length > 0) {
      setHeroMovie(trendingMovies[0]);
    }
  }, [trendingMovies]);

  if (loading) {
    return (
      <div className="container-fluid mt-5">
        <div className="row">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="col-md-3 mb-4">
              <SkeletonMovieCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      {heroMovie && (
        <div className="hero-section" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path || heroMovie.poster_path})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          color: 'white'
        }}>
          <div className="container">
            <div className="row">
              <div className="col-md-8">
                <h1 className="display-4 fw-bold mb-3">{heroMovie.title}</h1>
                <p className="lead mb-4">
                  {heroMovie.overview || 'Discover amazing movies and get personalized recommendations based on your taste.'}
                </p>
                <div className="d-flex gap-3">
                  <Link 
                    to={`/movie/${heroMovie.id}/${heroMovie.title.replace(/\s+/g, '-')}`}
                    className="btn btn-primary btn-lg"
                  >
                    Watch Now
                  </Link>
                  {user ? (
                    <Link to="/movies" className="btn btn-outline-light btn-lg">
                      Browse Movies
                    </Link>
                  ) : (
                    <Link to="/register" className="btn btn-outline-light btn-lg">
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Recommendations for Logged-in Users */}
      {user && preferredMovies && preferredMovies.length > 0 && (
        <section className="py-5">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title">Recommended for You</h2>
              <Link to="/movies" className="btn btn-outline-primary">View All</Link>
            </div>
            <div className="row">
              {preferredMovies.slice(0, 4).map((movie) => (
                <div key={movie.id} className="col-md-3 mb-4">
                  <div className="card movie-card h-100">
                    <Link to={`/movie/${movie.id}/${movie.title.replace(/\s+/g, '-')}`}>
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="card-img-top"
                        style={{ height: '400px', objectFit: 'cover' }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{movie.title}</h5>
                        <p className="card-text text-muted">
                          {movie.release_date && new Date(movie.release_date).getFullYear()}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Movies Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title">Trending Now</h2>
            <Link to="/movies/trending" className="btn btn-outline-primary">View All</Link>
          </div>
          <div className="row">
            {trendingMovies.slice(0, 8).map((movie) => (
              <div key={movie.id} className="col-md-3 mb-4">
                <div className="card movie-card h-100">
                  <Link to={`/movie/${movie.id}/${movie.title.replace(/\s+/g, '-')}`}>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="card-img-top"
                      style={{ height: '400px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{movie.title}</h5>
                      <p className="card-text text-muted">
                        {movie.release_date && new Date(movie.release_date).getFullYear()}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Movies Section */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title">Coming Soon</h2>
            <Link to="/movies/upcoming" className="btn btn-outline-primary">View All</Link>
          </div>
          <div className="row">
            {upcomingMovies.slice(0, 4).map((movie) => (
              <div key={movie.id} className="col-md-3 mb-4">
                <div className="card movie-card h-100">
                  <Link to={`/movie/${movie.id}/${movie.title.replace(/\s+/g, '-')}`}>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="card-img-top"
                      style={{ height: '400px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{movie.title}</h5>
                      <p className="card-text text-muted">
                        {movie.release_date && new Date(movie.release_date).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Why Choose Our Platform?</h2>
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="fas fa-brain fa-3x text-primary"></i>
              </div>
              <h4>AI-Powered Recommendations</h4>
              <p className="text-muted">
                Get personalized movie suggestions based on your watching history and preferences.
              </p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="fas fa-heart fa-3x text-primary"></i>
              </div>
              <h4>Personal Watchlist</h4>
              <p className="text-muted">
                Save your favorite movies and create custom watchlists for different moods.
              </p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="fas fa-users fa-3x text-primary"></i>
              </div>
              <h4>Community Features</h4>
              <p className="text-muted">
                Rate movies, read reviews, and discover what others are watching.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!user && (
        <section className="py-5 bg-primary text-white">
          <div className="container text-center">
            <h2 className="mb-4">Ready to Discover Amazing Movies?</h2>
            <p className="lead mb-4">
              Join thousands of movie enthusiasts and get personalized recommendations today!
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/register" className="btn btn-light btn-lg">
                Sign Up Free
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">
                Already Have an Account?
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage; 