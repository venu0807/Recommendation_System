import React, { useContext, useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { UserContext } from "../Context";
import { SkeletonPersonCard } from "../Skeleton";

export default function PersonComponent() {
  const { id } = useParams();
  const location = useLocation();
  const [movieData, setMovieData] = useState(null);
  const {
    movies,
    upcomingMovies,
    nowplayingMovies,
    trendingMovies,
    topratedMovies,
    loading,
  } = useContext(UserContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First try to get movie from location state
        if (location.state && location.state.movie) {
          setMovieData(location.state.movie);
          return;
        }

        // If not in state, try to find in context
        const contextMovie =
          movies.find((m) => m.id === parseInt(id)) ||
          upcomingMovies.find((m) => m.id === parseInt(id)) ||
          nowplayingMovies.find((m) => m.id === parseInt(id)) ||
          trendingMovies.find((m) => m.id === parseInt(id)) ||
          topratedMovies.find((m) => m.id === parseInt(id));

        if (contextMovie) {
          setMovieData(contextMovie);
          return;
        }

        // If not in context, fetch from API
        const response = await fetch(`http://localhost:8000/movie/${id}/`);
        const data = await response.json();
        setMovieData(data);
      } catch (error) {
        console.error("Error fetching movie data:", error);
      }
    };

    fetchData();
  }, [
    id,
    location.state,
    movies,
    upcomingMovies,
    nowplayingMovies,
    trendingMovies,
    topratedMovies,
  ]);

  if (!movieData) {
    return <div>Movie not found</div>;
  }

  const castToDisplay = movieData.cast ? movieData.cast : [];
  const crewToDisplay = movieData.crew ? movieData.crew : [];

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-md-6">
            <h3>Cast</h3>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-3">
                <SkeletonPersonCard />
              </div>
            ))}
          </div>
          <div className="col-md-6">
            <h3>Crew</h3>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-3">
                <SkeletonPersonCard />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatTitle = (title) => {
    return title.replace(/\s+/g, "-");
  };

  const getProfileImage = (profilePath) => {
    if (profilePath) {
      return `https://image.tmdb.org/t/p/w500${profilePath}`;
    }
    return 'https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg';
  };

  // Group crew members by department
  const groupedCrew = crewToDisplay.reduce((acc, crewMember) => {
    const department = crewMember.department || 'Other';
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(crewMember);
    return acc;
  }, {});

  // Sort departments alphabetically
  const sortedDepartments = Object.keys(groupedCrew).sort();

  return (
    <div className="container-fluid mt-4">
      <div className="row ml-5">
        <div className="col-md-6">
          <h3>Cast</h3>
          {castToDisplay.length > 0 ? (
            castToDisplay.map((castMember) => (
              <Link
                to={`/person/${castMember.member}/${formatTitle(
                  castMember.name
                )}`}
                className="link"
                style={{ textDecoration: "none" }}
              >
                <div key={castMember.id} className="crew-card mb-3">
                  <img
                    src={getProfileImage(castMember.profile_path)}
                    alt={castMember.name}
                    className="card-img-top"
                    height={150}
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="card-body text-dark">
                    <b className="card-title">{castMember.name}</b>
                    <span className="card-text">{castMember.character}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>No cast information available.</p>
          )}
        </div>

        <div className="col-md-6">
          <h3>Crew</h3>
          {crewToDisplay.length > 0 ? (
            sortedDepartments.map((department) => (
              <div key={department}>
                <h4 className="mt-4 mb-3">{department}</h4>
                {groupedCrew[department].map((crewMember) => (
                  <Link
                    key={`${crewMember.member}-${crewMember.job}`}
                    to={`/person/${crewMember.member}/${formatTitle(
                      crewMember.name
                    )}`}
                    className="link text-light"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="crew-card mb-3">
                      <img
                        src={getProfileImage(crewMember.profile_path)}
                        alt={crewMember.name}
                        className="card-img-top"
                        height={150}
                        style={{ objectFit: 'cover' }}
                      />
                      <h3>{crewMember.roles}</h3>
                      <div className="card-body text-dark">
                        <b className="card-title">{crewMember.name}</b>
                        <p className="card-text">{crewMember.job}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))
          ) : (
            <p>No crew information available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
