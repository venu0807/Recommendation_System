import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SkeletonMovieDetail, SkeletonPersonCard } from "../Skeleton";
import { UserContext } from "../Context";

export default function TvShowDetail() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, authTokens } = useContext(UserContext);
  const [rating, setRating] = useState("");
  const [userRating, setUserRating] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShow = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${'https://movies-backend-ophs.onrender.com'}/tv/${id}/`);
        if (!response.ok) throw new Error('Failed to fetch TV show');
        const data = await response.json();
        setShow(data);
      } catch (error) {
        setShow(null);
      }
      setLoading(false);
    };
    if (id) fetchShow();
  }, [id]);

  useEffect(() => {
    if (!user || !authTokens) return;
    // Fetch user rating
    fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-rating/my_ratings/`, {
      headers: { Authorization: `Bearer ${authTokens.access}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((r) => String(r.tv_show) === show?.name);
        if (found) {
          setUserRating(found.rating);
          setRating(found.rating);
        }
      });
    // Fetch favorite status
    fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-favorite/`, {
      headers: { Authorization: `Bearer ${authTokens.access}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsFavorite(data.some((fav) => fav.tv_show === show?.name));
      });
    // Fetch watchlist status
    fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-watchlist/`, {
      headers: { Authorization: `Bearer ${authTokens.access}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsWatchlisted(data.some((item) => item.tv_show === show?.name));
      });
    // Fetch reviews
    fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-review/?tv_show_id=${id}`, {
      headers: { Authorization: `Bearer ${authTokens.access}` },
    })
      .then((res) => res.json())
      .then(setReviews);
  }, [user, authTokens, show, id]);

  const handleRatingSubmit = async () => {
    if (!user || !authTokens) return navigate("/login");
    await fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-rating/rate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authTokens.access}`,
      },
      body: JSON.stringify({ tv_show_id: id, rating }),
    });
    setUserRating(rating);
  };

  const handleFavoriteClick = async () => {
    if (!user || !authTokens) return navigate("/login");
    setIsLoading(true);
    if (isFavorite) {
      await fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-favorite/${id}/remove/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      setIsFavorite(false);
    } else {
      await fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-favorite/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({ tv_show_id: id }),
      });
      setIsFavorite(true);
    }
    setIsLoading(false);
  };

  const handleWatchlistClick = async () => {
    if (!user || !authTokens) return navigate("/login");
    setIsLoading(true);
    if (isWatchlisted) {
      await fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-watchlist/${id}/remove/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      setIsWatchlisted(false);
    } else {
      await fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-watchlist/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({ tv_show_id: id }),
      });
      setIsWatchlisted(true);
    }
    setIsLoading(false);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user || !authTokens) return navigate("/login");
    await fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-review/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authTokens.access}`,
      },
      body: JSON.stringify({ tv_show: id, review: reviewText }),
    });
    setReviewText("");
    // Refresh reviews
    fetch(`${'https://movies-backend-ophs.onrender.com'}/tvshow-review/?tv_show_id=${id}`, {
      headers: { Authorization: `Bearer ${authTokens.access}` },
    })
      .then((res) => res.json())
      .then(setReviews);
  };

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

  if (!show || show.detail === "Not found.") {
    return <div className="container mt-5">TV Show not found</div>;
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-md-4">
          <img
            src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
            alt={show.name}
            className="img-fluid rounded"
          />
        </div>
        <div className="col-md-8">
          <h2>{show.name}</h2>
          {show.genres && show.genres.length > 0 && (
            <div className="mb-2">
              {show.genres.map((genre) => (
                <span key={genre.id || genre.name} className="badge bg-secondary me-2">
                  {genre.name}
                </span>
              ))}
            </div>
          )}
          <p><strong>First Air Date:</strong> {show.first_air_date}</p>
          <p><strong>Overview:</strong> {show.overview}</p>
          <p><strong>Number of Seasons:</strong> {show.seasons?.length || 0}</p>
          <p><strong>Number of Episodes:</strong> {show.episodes?.length || show.number_of_episodes || 0}</p>
          {/* Trailers */}
          {show.trailer_link && (
            <a href={show.trailer_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary mb-2">Watch Trailer</a>
          )}
          {/* Images */}
          {show.images && show.images.length > 0 && (
            <div className="mb-3">
              <h5>Images</h5>
              <div className="d-flex flex-wrap gap-2">
                {show.images.map((img, idx) => (
                  <img key={idx} src={img} alt="Show" style={{ width: 120, borderRadius: 8 }} />
                ))}
              </div>
            </div>
          )}
          {/* User Interactions */}
          <div className="mb-3">
            <label>Rate this show:</label>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="">Select a rating</option>
              {[...Array(11).keys()].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm ms-2" onClick={handleRatingSubmit} disabled={isLoading}>Submit</button>
            {userRating && <span className="ms-2">Your rating: {userRating}</span>}
            <button className={`btn btn-outline-danger btn-sm ms-3 ${isFavorite ? 'active' : ''}`} onClick={handleFavoriteClick} disabled={isLoading}>{isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</button>
            <button className={`btn btn-outline-success btn-sm ms-2 ${isWatchlisted ? 'active' : ''}`} onClick={handleWatchlistClick} disabled={isLoading}>{isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}</button>
          </div>
        </div>
      </div>
      {/* Seasons */}
      {show.seasons && show.seasons.length > 0 && (
        <div className="mt-4">
          <h3>Seasons</h3>
          <div className="row">
            {show.seasons.map((season) => (
              <div key={season.id} className="col-md-3 mb-3">
                <div className="card">
                  <img src={`https://image.tmdb.org/t/p/w500${season.poster_path}`} alt={season.name} className="card-img-top" />
                  <div className="card-body">
                    <h5 className="card-title">{season.name}</h5>
                    <p className="card-text">{season.overview}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Cast */}
      {show.cast && show.cast.length > 0 && (
        <div className="mt-4">
          <h3>Cast</h3>
          <div className="row">
            {show.cast.slice(0, 10).map((castMember) => (
              <div key={castMember.id} className="col-md-2 mb-3">
                <Link to={`/person/${castMember.member}/${castMember.name.replace(/\s+/g, "-")}`} className="link">
                  <div className="card cast-card border-0">
                    {castMember.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${castMember.profile_path}`}
                        alt={castMember.name}
                        className="card-img-top"
                        height={150}
                      />
                    ) : (
                      <div className="no-image-placeholder">No Image</div>
                    )}
                    <div className="card-body text-dark">
                      <h6 className="card-title">{castMember.name}</h6>
                      <p className="card-text">{castMember.job}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Crew */}
      {show.crew && show.crew.length > 0 && (
        <div className="mt-4">
          <h3>Crew</h3>
          <div className="row">
            {show.crew.slice(0, 6).map((crewMember) => (
              <div key={crewMember.id} className="col-md-2 mb-3">
                <Link to={`/person/${crewMember.member}/${crewMember.name.replace(/\s+/g, "-")}`} className="link">
                  <div className="card crew-card border-0">
                    <div className="card-body text-dark">
                      <h6 className="card-title">{crewMember.name}</h6>
                      <p className="card-text">{crewMember.job}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Reviews/Comments */}
      <div className="mt-4">
        <h3>Reviews & Comments</h3>
        {user && (
          <form onSubmit={handleReviewSubmit} className="mb-3">
            <textarea className="form-control" value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write a review..." required />
            <button className="btn btn-primary btn-sm mt-2" type="submit">Submit Review</button>
          </form>
        )}
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <ul className="list-group">
            {reviews.map((rev) => (
              <li key={rev.id} className="list-group-item">
                <b>{rev.user}:</b> {rev.review} <span className="text-muted">({new Date(rev.created_at).toLocaleString()})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 