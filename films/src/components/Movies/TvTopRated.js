import React, { useContext } from "react";
import { UserContext } from "../Context";
import { Link } from "react-router-dom";
import { SkeletonMovieCard } from "../Skeleton";

export default function TvTopRated() {
  const { tvShowsTopRated, loading } = useContext(UserContext);

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
      <h2>Top Rated TV Shows</h2>
      <div className="row ml-5 pl-5">
        {tvShowsTopRated.map((show) => (
          <div key={show.id} className="col-md-3">
            <div className="card movie-card mb-3">
              <Link
                to={`/tv/${show.id}/${show.name.replace(/\s+/g, "-")}`}
                className="link"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                  alt={show.name}
                  className="card-img-top"
                />
                <div className="card-body">
                  <b className="card-title text-dark">{show.name}</b>
                </div>
                <div className="card-bottom">
                  <b className="card-title text-dark">
                    {show.first_air_date}
                  </b>
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
