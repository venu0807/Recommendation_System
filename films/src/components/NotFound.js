import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="text-center">
        <div className="mb-4">
          <h1 className="display-1 text-muted">404</h1>
          <h2 className="mb-3">Page Not Found</h2>
          <p className="lead text-muted mb-4">
            Oops! The page you're looking for doesn't exist. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        <div className="d-flex justify-content-center gap-3 mb-4">
          <Link to="/" className="btn btn-primary btn-lg">
            <i className="fas fa-home me-2"></i>
            Go Home
          </Link>
          <Link to="/movies" className="btn btn-outline-primary btn-lg">
            <i className="fas fa-film me-2"></i>
            Browse Movies
          </Link>
        </div>
        
        <div className="text-muted">
          <p>Or try one of these popular pages:</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/movies/trending" className="text-decoration-none text-muted">
              Trending Movies
            </Link>
            <Link to="/movies/upcoming" className="text-decoration-none text-muted">
              Upcoming Movies
            </Link>
            <Link to="/tv" className="text-decoration-none text-muted">
              TV Shows
            </Link>
            <Link to="/search" className="text-decoration-none text-muted">
              Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 
