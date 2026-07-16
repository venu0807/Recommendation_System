import React from 'react';
import { Link } from 'react-router-dom';

export default function TvShow() {
  return (
    <div className="container mt-5">
      <h2>TV Shows</h2>
      <ul className="list-group list-group-flush">
        <li className="list-group-item"><Link to="/tv/popular">Popular</Link></li>
        <li className="list-group-item"><Link to="/tv/top-rated">Top Rated</Link></li>
        <li className="list-group-item"><Link to="/tv/on-air">On Air</Link></li>
      </ul>
    </div>
  );
}
