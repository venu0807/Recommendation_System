import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
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
              <a href="#" className="text-light me-3">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-light me-3">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-light me-3">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-light">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-2 mb-4">
            <h6 className="mb-3">Movies</h6>
            <ul className="list-unstyled">
              <li><Link to="/movies" className="text-muted text-decoration-none">Popular</Link></li>
              <li><Link to="/movies/trending" className="text-muted text-decoration-none">Trending</Link></li>
              <li><Link to="/movies/upcoming" className="text-muted text-decoration-none">Upcoming</Link></li>
              <li><Link to="/movies/top-rated" className="text-muted text-decoration-none">Top Rated</Link></li>
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
              <li><a href="#" className="text-muted text-decoration-none">Help Center</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Contact Us</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Privacy Policy</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Terms of Service</a></li>
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
};

export default Footer; 