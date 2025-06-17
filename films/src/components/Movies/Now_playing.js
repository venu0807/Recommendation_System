import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../Context";
import { Link } from "react-router-dom";
import { SkeletonMovieCard } from "../Skeleton";
import SortFilter from "../SortFilter";

export default function Nowplaying() {
  const { nowplayingMovies, loading } = useContext(UserContext);
  const [sortedMovies, setSortedMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    if (nowplayingMovies) {
      setSortedMovies([...nowplayingMovies]);
      setFilteredMovies([...nowplayingMovies]);
    }
  }, [nowplayingMovies]);

  useEffect(() => {
    const fetchGenres = async () => {
      const response = await fetch('http://localhost:8000/genre/');
      const data = await response.json();
      setGenres(data);
    };
    const fetchKeywords = async () => {
      const response = await fetch('http://localhost:8000/keyword/');
      const data = await response.json();
      setKeywords(data);
    };
    fetchGenres();
    fetchKeywords();
  }, []);

  const handleSort = (sortType) => {
    let sorted = [...filteredMovies];
    switch (sortType) {
      case 'popularity_asc':
        sorted.sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
        break;
      case 'popularity_desc':
        sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'rating_asc':
        sorted.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
        break;
      case 'rating_desc':
        sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'release_date_asc':
        sorted.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
        break;
      case 'release_date_desc':
        sorted.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        break;
      case 'title_asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    setSortedMovies(sorted);
  };

  const handleFilter = (filterOptions) => {
    let filtered = [...nowplayingMovies];
    if (filterOptions.genre) {
      filtered = filtered.filter(movie =>
        movie.genres.some(genre => genre.name === filterOptions.genre)
      );
    }
    if (filterOptions.keyword) {
      filtered = filtered.filter(movie =>
        movie.keywords.some(keyword => keyword.name === filterOptions.keyword)
      );
    }
    setFilteredMovies(filtered);
    setSortedMovies(filtered);
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

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <div className="col-md-3">
          <SortFilter
            onSort={handleSort}
            onFilter={handleFilter}
            genres={genres}
            keywords={keywords}
          />
        </div>
        <div className="col-md-9">
          <div className="row ml-5 pl-5">
            {sortedMovies.map((movie) => (
              <div key={movie.id} className="col-md-3">
                <div className="card movie-card mb-3">
                  <Link
                    to={`/movie/${movie.id}/${movie.title.replace(/\s+/g, "-")}`}
                    className="link"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="card-img-top"
                    />
                    <div className="card-body">
                      <b className="card-title text-dark">{movie.title}</b>
                    </div>
                    <div className="card-bottom">
                      <b className="card-title text-dark">
                        {movie.release_date}
                      </b>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
