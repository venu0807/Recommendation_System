import React, { useContext, useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../Context";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { SkeletonMovieDetail, SkeletonPersonCard } from "../Skeleton";
import CacheService from '../../services/CacheService';
import CookieService from '../../services/CookieService';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    user,
    authTokens,
    rateMovie,
    favorites,
    watchlist,
    addToFavorites,
    removeFromFavorites,
    addToWatchlist,
    removeFromWatchlist,
    preferences,
  } = useContext(UserContext);

  const [videoUrl, setVideoUrl] = useState(null); // State to store the video URL
  const [showModal, setShowModal] = useState(false); // State to toggle modal visibility
  const [foundMovie, setFoundMovie] = useState(null); // State to store the fetched movie
  const [rating, setRating] = useState(""); // State for rating input
  const [feedback, setFeedback] = useState(""); // Optional feedback
  const [userRating, setUserRating] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const navigate = useNavigate();

  // Fetch movie details based on id
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        // Check cache first
        const cachedMovie = await CacheService.get(`movie_${id}`);
        if (cachedMovie) {
          setMovie(cachedMovie);
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/movie/${id}/`);
        const data = await response.json();
        
        // Cache the movie data
        await CacheService.set(`movie_${id}`, data);
        setMovie(data);

        // Track movie view in cookies
        const viewedMovies = CookieService.get('viewedMovies');
        const viewed = viewedMovies ? JSON.parse(viewedMovies) : [];
        if (!viewed.includes(id)) {
          viewed.push(id);
          CookieService.set('viewedMovies', JSON.stringify(viewed));
        }
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieDetails();
  }, [id]);

  // Find the movie from the context
  const fetchMovieDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/movie/${id}/`);
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error("Error fetching movie details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovieDetails();
  }, [fetchMovieDetails]);

  useEffect(() => {
    if (user && movie) {
      setIsFavorite(favorites.some((fav) => fav.movie.id === movie.id));
      setIsWatchlisted(watchlist.some((item) => item.movie.id === movie.id));
    }
  }, [user, movie, favorites, watchlist]);

  // Add this useEffect to check if movie is in favorites when component mounts
  useEffect(() => {
    if (user && movie && favorites) {
      // Check if the current movie is in favorites
      const isMovieFavorite = favorites.some(
        (fav) => fav.movie.id === parseInt(id)
      );
      setIsFavorite(isMovieFavorite);
    }
  }, [user, movie, favorites, id]);

  if (loading) {
    return (
      <div className="container mt-5">
        <SkeletonMovieDetail />
        <h3 className="mt-4">Cast</h3>
        <div className="row">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-md-3">
              <SkeletonPersonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!movie) {
    return <div>Loading...</div>;
  }

  const castToDisplay = movie.cast ? movie.cast.slice(0, 10) : [];
  const crewToDisplay = movie.crew ? movie.crew.slice(0, 6) : [];

  const backgroundStyle = {
    backgroundImage: movie.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
      : "none",
    backgroundColor: movie.backdrop_path ? "transparent" : "#333",
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "500px",
  };

  // Function to convert a video URL to the embed format
  const convertToEmbedURL = (url) => {
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    return url;
  };

  // Function to open the modal with the given video URL
  const handlePlayVideo = (url) => {
    const embedUrl = `${convertToEmbedURL(url)}?autoplay=${
      preferences.autoplayTrailers ? 1 : 0
    }`;
    setVideoUrl(embedUrl);
    setShowModal(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setVideoUrl(null);
    setShowModal(false);
  };

  const handleOpenRatingModal = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowRatingModal(true);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      alert("Please select a rating before submitting.");
      return;
    }

    try {
      await rateMovie(movie.id, rating, feedback);
      setUserRating(rating);
      handleCloseRatingModal();
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  const formatTitle = (title) => {
    return title.replace(/\s+/g, "-");
  };

  const getProfileImage = (profilePath) => {
    if (profilePath) {
      return `https://image.tmdb.org/t/p/w500${profilePath}`;
    }
    return "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg";
  };

  const handleFavoriteClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        const success = await removeFromFavorites(movie.id);
        if (success) setIsFavorite(false);
      } else {
        const success = await addToFavorites(movie.id);
        if (success) setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
    setIsLoading(false);
  };

  const handleWatchlistClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      if (isWatchlisted) {
        const success = await removeFromWatchlist(movie.id);
        if (success) setIsWatchlisted(false);
      } else {
        const success = await addToWatchlist(movie.id);
        if (success) setIsWatchlisted(true);
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div className="container-fluid mt-4">
        <div className="movie-container">
          <div className="movie-bg" style={backgroundStyle}></div>
          <div className="movie-overlay"></div> {/* Add this line */}
          <div className="movie-content">
            <div className="movie-left ">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="movie-poster-img lazyload"
              />
            </div>
            <div className="movie-right">
              <h2>{movie.title}</h2>
              <h6>{movie.runtime} min</h6>
              <h6>{movie.popularity}</h6>
              <b>{userRating}</b>
              <div className="d-flex">
                <button
                  className="btn action-btn text-light"
                  onClick={handleOpenRatingModal}
                >
                  WhatsYourVibe?
                </button>
                {user && (
                  <div className="action-buttons">
                    <button
                      className={`btn action-btn favorite-btn text-light ${
                        isFavorite ? "active" : ""
                      }`}
                      onClick={handleFavoriteClick}
                      disabled={isLoading}
                    >
                      {isFavorite ? (
                        <>
                          <FavoriteIcon style={{ color: "red" }} />
                          <span></span>
                        </>
                      ) : (
                        <>
                          <FavoriteBorderIcon />
                          <span></span>
                        </>
                      )}
                    </button>
                    <button
                      className={`btn action-btn watchlist-btn text-light ${
                        isWatchlisted ? "active" : ""
                      }`}
                      onClick={handleWatchlistClick}
                      disabled={isLoading}
                    >
                      {isWatchlisted ? (
                        <BookmarkIcon />
                      ) : (
                        <BookmarkBorderIcon />
                      )}
                      {isWatchlisted ? "" : ""}
                    </button>
                  </div>
                )}
              </div>
              <p>
                <strong>Release Date: {movie.release_date} </strong>
              </p>
              <div className="d-flex">
                <p>
                  <strong>Rating: {movie.vote_average}</strong>
                </p>
                {movie.trailer_link ? (
                  <h6
                    className="ml-5 mr-5"
                    onClick={() => handlePlayVideo(movie.trailer_link)}
                  >
                    <PlayArrowRoundedIcon></PlayArrowRoundedIcon>Watch Trailer
                  </h6>
                ) : (
                  <></>
                )}
                {movie.teaser_link ? (
                  <h6
                    className="ml-5 mr-5"
                    onClick={() => handlePlayVideo(movie.teaser_link)}
                  >
                    <PlayArrowRoundedIcon></PlayArrowRoundedIcon>Watch Teaser
                  </h6>
                ) : (
                  <></>
                )}
              </div>
              <p>{movie.overview}</p>
              <div
                className="crew-container"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gridTemplateRows: "repeat(2, auto)",
                  gap: "1rem",
                  maxWidth: "100%",
                }}
              >
                {crewToDisplay.length > 0 ? (
                  crewToDisplay.slice(0, 6).map((crewMember) => (
                    <div
                      key={crewMember.id}
                      className="crew-member"
                      style={{
                        padding: "5px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                      }}
                    >
                      <Link
                        to={`/person/${crewMember.member}/${formatTitle(
                          crewMember.name
                        )}`}
                        className="link text-light"
                        style={{ textDecoration: "none" }}
                      >
                        <div className="crew-info">
                          <div className="crew-name">{crewMember.name}</div>
                          <div className="crew-job" style={{ opacity: 0.7 }}>
                            {crewMember.job}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p>No crew information available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4 ml-5">
          <div className="col-md-9">
            <h3>Cast</h3>
            <div
              className="cast-scroll-container"
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "15px",
                paddingBottom: "10px",
              }}
            >
              {castToDisplay.length > 0 ? (
                castToDisplay.map((castMember) => (
                  <div
                    key={castMember.id}
                    className="card cast-card border-0"
                    style={{
                      minWidth: "120px",
                      margin: "0 5px",
                    }}
                  >
                    <Link
                      to={`/person/${castMember.member}/${formatTitle(
                        castMember.name
                      )}`}
                      className="link"
                    >
                      <img
                        src={getProfileImage(castMember.profile_path)}
                        alt={castMember.name}
                        className="card-img-top"
                        height={150}
                        style={{ objectFit: "cover" }}
                      />

                      <div className="card-body text-dark">
                        <h6 className="card-title">{castMember.name}</h6>
                        <p className="card-text">{castMember.job}</p>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <p>No cast information available.</p>
              )}
              <div
                className="card cast-card"
                style={{
                  minWidth: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "0",
                }}
              >
                <Link
                  to={`/movie/${movie.id}/${formatTitle(movie.title)}/cast`}
                  className="link d-flex align-items-center text-dark"
                  state={{ movie: movie }} // Add this line to pass movie data
                >
                  <b className="mb-3 pb-5">View More</b>
                  <ArrowRightAltIcon
                    style={{ fontSize: "2rem", marginBottom: "4rem" }}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}

      <div class="modal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Modal title</h5>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Modal body text goes here.</p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button type="button" class="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={handleCloseModal}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Playing Video</h5>
                <button
                  type="button"
                  className="btn -close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                {videoUrl ? (
                  <iframe
                    width="100%"
                    height="400"
                    src={videoUrl}
                    title="Video Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rate "{movie.title}"</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseRatingModal}
                ></button>
              </div>
              <form onSubmit={handleRatingSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Your Rating (0-10)</label>
                    <select
                      className="form-select"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      required
                    >
                      <option value="">Select a rating</option>
                      {[...Array(11).keys()].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Your Feedback (optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Share your thoughts about the movie..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseRatingModal}
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Rating
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
