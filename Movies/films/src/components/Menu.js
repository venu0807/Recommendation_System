import React, { useContext, useState } from "react";
import { UserContext } from "./Context";
import { Link, useNavigate } from "react-router-dom";
import LoginIcon from "@mui/icons-material/Login";
import SearchIcon from "@mui/icons-material/Search";

export default function Menu() {
  const { user, logoutUser, theme, toggleTheme, addNotification, addToWatchHistory, addToSearchHistory, preferences, updatePreferences } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      addToSearchHistory(searchQuery);
      setSearchQuery("");
    }
  };

  const handleMouseEnter = () => {
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="fixed-top">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <h3 className="mb-0 brand-text">FilmFinder</h3>
          </Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item dropdown">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  id="moviesDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Movies
                </Link>
                <ul className="dropdown-menu animate slideIn" aria-labelledby="moviesDropdown">
                  <li><Link className="dropdown-item" to="/movie">Popular</Link></li>
                  <li><Link className="dropdown-item" to="/movie/top-rated">Top Rated</Link></li>
                  <li><Link className="dropdown-item" to="/movie/now-playing">Now Playing</Link></li>
                  <li><Link className="dropdown-item" to="/movie/upcoming">Upcoming</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/tv">TV Shows</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/">People</Link>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-3">
              <form onSubmit={handleSearch} className="d-flex">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-outline-light" type="submit">
                    <SearchIcon />
                  </button>
                </div>
              </form>

              {user ? (
                <div 
                  className="dropdown"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className="btn btn-link nav-link dropdown-toggle d-flex align-items-center"
                    type="button"
                    id="userDropdown"
                    aria-expanded={isDropdownOpen}
                  >
                    <div className="user-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <ul className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? 'show' : ''}`} aria-labelledby="userDropdown">
                    <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                    <li><Link className="dropdown-item" to="/watchlist">Watchlist</Link></li>
                    <li><Link className="dropdown-item" to="/favorites">Favorites</Link></li>
                    {/* <li><Link className="dropdown-item" to="/settings">Settings</Link></li> */}
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={logoutUser}>Logout</button></li>
                  </ul>
                </div>
              ) : (
                <Link to="/login" className="btn btn-outline-light login-btn">
                  <LoginIcon className="me-2" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
