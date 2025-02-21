import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SkeletonPersonCard, SkeletonMovieCard } from '../Skeleton';

const PersonDetail = () => {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        // Fetch person details
        const personResponse = await fetch(`http://localhost:8000/person/${id}/`);
        if (!personResponse.ok) {
          throw new Error('Person not found');
        }
        const personData = await personResponse.json();
        setPerson(personData);

        // Fetch person's movies
        const moviesResponse = await fetch(`http://localhost:8000/person/${id}/movies/`);
        if (!moviesResponse.ok) {
          throw new Error('Could not fetch movies');
        }
        const moviesData = await moviesResponse.json();
        setMovies(moviesData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPersonDetails();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.getFullYear();
  };

  // Get top 4 movies by popularity
  const topMovies = [...movies]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);

  // Update the role display function
  const getRole = (movie) => {
    if (movie.role_type === 'cast') {
      return `Actor (${movie.role || 'Unknown Role'})`;
    }
    return movie.role || 'Crew Member';
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-4">
            <SkeletonPersonCard />
          </div>
          <div className="col-md-8">
            <div className="skeleton title"></div>
            <div className="skeleton text mt-3"></div>
            <div className="skeleton text"></div>
            <div className="skeleton text"></div>
            <h3 className="mt-4">Popular Movies</h3>
            <div className="row">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="col-md-3">
                  <SkeletonMovieCard />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="container mt-5">Error: {error}</div>;
  if (!person) return <div className="container mt-5">Person not found</div>;

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Left Column - Person Info */}
        <div className="col-md-4">
          <div className="card">
            {person.profile_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                className="card-img-top"
                alt={person.name}
              />
            ) : (
              <div className="no-image-placeholder">No Image Available</div>
            )}
          </div>
          
          <div className="personal-info mt-4">
            <h4>Personal Info</h4>
            <div className="info-item">
              <strong>Known For</strong>
              <p>{person.known_for_department}</p>
            </div>
            <div className="info-item">
              <strong>Birthday</strong>
              <p>{person.birthday || 'Not Available'}</p>
            </div>
            {person.deathday && (
              <div className="info-item">
                <strong>Died</strong>
                <p>{person.deathday}</p>
              </div>
            )}
            <div className="info-item">
              <strong>Place of Birth</strong>
              <p>{person.place_of_birth || 'Not Available'}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Biography and Filmography */}
        <div className="col-md-8">
          <h1>{person.name}</h1>
          
          {person.biography && (
            <div className="biography mt-4">
              <h3>Biography</h3>
              <p>{person.biography}</p>
            </div>
          )}

          {/* Top 4 Movies with Images */}
          <div className="top-movies mt-4">
            <h3>Popular Movies</h3>
            <div className="row g-4">
              {topMovies.map(movie => (
                <div key={movie.id} className="col-6 col-md-3">
                  <Link 
                     to={`/movie/${movie.id}/${movie.title.replace(/\s+/g, "-")}`}
                    className="text-decoration-none"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="movie-card">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          className="img-fluid rounded"
                          alt={movie.title}
                        />
                      ) : (
                        <div className="no-image-placeholder rounded">No Image</div>
                      )}
                      <div className="movie-info mt-2">
                        <h6 className="movie-title">{movie.title}</h6>
                        <small className="text-muted">
                          {formatDate(movie.release_date)}
                        </small>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Filmography Table */}
          <div className="filmography mt-5">
            <h3>Complete Filmography ({movies.length} titles)</h3>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Movie</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map(movie => (
                    <tr key={movie.id}>
                      <td>{formatDate(movie.release_date)}</td>
                      <td>
                        <Link 
                          to={`/movie/${movie.id}/${movie.title.replace(/\s+/g, "-")}`}
                          className="movie-link"
                          style={{ cursor: 'pointer', textDecoration: 'none' }}
                        >
                          {movie.title}
                        </Link>
                      </td>
                      <td>{getRole(movie)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetail;
