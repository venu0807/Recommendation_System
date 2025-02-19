import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { SkeletonMovieCard } from './Skeleton';
import CacheService from '../services/CacheService';
import CookieService from '../services/CookieService';

export default function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("query");
  const [results, setResults] = useState({ movies: [], persons: [] });
  const [loading, setLoading] = useState(true);
  const [activeDepartment, setActiveDepartment] = useState("movies");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check cache first
        const cacheKey = `search_${query}_${activeDepartment}`;
        const cachedResults = await CacheService.get(cacheKey);
        if (cachedResults) {
          setResults(cachedResults);
          setLoading(false);
          return;
        }

        const url = `http://localhost:8000/movie/search?query=${query}&department=${activeDepartment}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch results');
        const data = await response.json();
        
        // Cache the results
        await CacheService.set(cacheKey, data);
        setResults(data);

        // Save search history in cookies
        const searchHistory = CookieService.get('searchHistory');
        const history = searchHistory ? JSON.parse(searchHistory) : [];
        if (!history.includes(query)) {
          history.unshift(query);
          if (history.length > 10) history.pop();
          CookieService.set('searchHistory', JSON.stringify(history));
        }
      } catch (error) {
        setError(error.message);
        console.error("Error fetching search results:", error);
      }
      setLoading(false);
    };

    if (query) fetchResults();
  }, [query, activeDepartment]);

  const handleDepartmentChange = (department) => setActiveDepartment(department);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="row">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="col-md-3 mb-4">
              <SkeletonMovieCard />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="empty-state">
          <img src="/error-illustration.svg" alt="Error" />
          <h3>Oops! Something went wrong</h3>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      );
    }

    const currentResults = activeDepartment === "movies" ? results.movies : results.persons;
    const sortedResults = [...currentResults].sort((a, b) => {
      const aHasImage = Boolean(a.poster_path || a.profile_path);
      const bHasImage = Boolean(b.poster_path || b.profile_path);
      if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;
      return (b.popularity || 0) - (a.popularity || 0);
    });

    if (sortedResults.length === 0) {
      return (
        <div className="empty-state">
          <img src="/empty-results.svg" alt="No results" />
          <h3>No results found</h3>
          <p className="text-muted">Try adjusting your search or filters</p>
        </div>
      );
    }

    return (
      <div className="row g-3 animate slideIn">
        {sortedResults.map((item) => (
          <div key={item.id} className="col-6 col-md-3 col-lg-2">
            <div className="search-card h-100">
              <span className={`category-badge ${activeDepartment}-badge`}>
                {activeDepartment.slice(0, -1)}
              </span>
              <Link
                to={`/${activeDepartment === "movies" ? "movie" : "person"}/${item.id}/${
                  (item.title || item.name).replace(/\s+/g, "-")
                }`}
                className="link h-100"
              >
                {item.poster_path || item.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path || item.profile_path}`}
                    alt={item.title || item.name}
                    className="card-img-top"
                    loading="lazy"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    {activeDepartment === "persons" ? (
                      <i className="fas fa-user fa-3x"></i>
                    ) : (
                      <i className="fas fa-film fa-3x"></i>
                    )}
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title text-dark">{item.title || item.name}</h5>
                  {item.release_date && (
                    <p className="card-text">
                      <small className="text-muted">
                        {new Date(item.release_date).getFullYear()}
                      </small>
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="filter-section">
            <h5 className="card-title mb-3">Categories</h5>
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2">
                {["movies", "persons"].map((dept) => (
                  <button
                    key={dept}
                    className={`filter-button ${activeDepartment === dept ? 'active' : ''}`}
                    onClick={() => handleDepartmentChange(dept)}
                  >
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              Search Results for "{query}"
              {!loading && (
                <span className="results-counter ms-3">
                  <i className="fas fa-search"></i>
                  {results[activeDepartment]?.length || 0} results
                </span>
              )}
            </h2>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
