import React from 'react';
import { Link } from 'react-router-dom';

const Footer = React.memo(() => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <div className="container">
        <div className="row">
          {/* Company Info */}
          <div className="col-md-4 mb-4">
            <h5 className="mb-3">Movie Recommender</h5>
            <p className="text-muted">
              Your AI-powered movie discovery platform. Get personalized recommendations, 
              manage your watchlist, and discover amazing films tailored to your taste.
            </p>
            <div className="social-links">
              <button className="btn btn-link text-light me-3 p-0" style={{textDecoration: 'none'}}>
                <i className="fab fa-facebook-f"></i>
              </button>
              <button className="btn btn-link text-light me-3 p-0" style={{textDecoration: 'none'}}>
                <i className="fab fa-twitter"></i>
              </button>
              <button className="btn btn-link text-light me-3 p-0" style={{textDecoration: 'none'}}>
                <i className="fab fa-instagram"></i>
              </button>
              <button className="btn btn-link text-light p-0" style={{textDecoration: 'none'}}>
                <i className="fab fa-linkedin-in"></i>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-2 mb-4">
            <h6 className="mb-3">Movies</h6>
            <ul className="list-unstyled">
              <li><Link to="/movies" className="text-muted text-decoration-none">Popular</Link></li>
              <li><Link to="/movies/top-rated" className="text-muted text-decoration-none">Top Rated</Link></li>
              <li><Link to="/movies/upcoming" className="text-muted text-decoration-none">Upcoming</Link></li>
              <li><Link to="/movies/now-playing" className="text-muted text-decoration-none">Nowplaying</Link></li>
            </ul>
          </div>

          {/* TV Shows */}
          <div className="col-md-2 mb-4">
            <h6 className="mb-3">TV Shows</h6>
            <ul className="list-unstyled">
              <li><Link to="/tv" className="text-muted text-decoration-none">All Shows</Link></li>
              <li><Link to="/tv/popular" className="text-muted text-decoration-none">Popular</Link></li>
              <li><Link to="/tv/top-rated" className="text-muted text-decoration-none">Top Rated</Link></li>
              <li><Link to="/tv/on-air" className="text-muted text-decoration-none">On Air</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="col-md-2 mb-4">
            <h6 className="mb-3">Account</h6>
            <ul className="list-unstyled">
              <li><Link to="/profile" className="text-muted text-decoration-none">Profile</Link></li>
              <li><Link to="/watchlist" className="text-muted text-decoration-none">Watchlist</Link></li>
              <li><Link to="/favorites" className="text-muted text-decoration-none">Favorites</Link></li>
              <li><Link to="/settings" className="text-muted text-decoration-none">Settings</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-md-2 mb-4">
            <h6 className="mb-3">Support</h6>
            <ul className="list-unstyled">
              <li><button className="btn btn-link text-muted text-decoration-none p-0">Help Center</button></li>
              <li><button className="btn btn-link text-muted text-decoration-none p-0">Contact Us</button></li>
              <li><button className="btn btn-link text-muted text-decoration-none p-0">Privacy Policy</button></li>
              <li><button className="btn btn-link text-muted text-decoration-none p-0">Terms of Service</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <hr className="my-4" />
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="mb-0 text-muted">
              © {currentYear} Movie Recommender. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0 text-muted">
              Powered by AI & Machine Learning
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
