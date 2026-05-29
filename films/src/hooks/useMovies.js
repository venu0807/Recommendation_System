import { useState } from "react";
import API_BASE_URL from "../config";

/**
 * Movies and TV shows hook with data fetching, rating, and recommendations.
 * @param {object|null} authTokens - JWT auth tokens with `access` property
 * @returns {{
 *   movies: Array,
 *   setMovies: Function,
 *   upcomingMovies: Array,
 *   setUpcomingMovies: Function,
 *   nowplayingMovies: Array,
 *   setNowplayingMovies: Function,
 *   trendingMovies: Array,
 *   setTrendingMovies: Function,
 *   topratedMovies: Array,
 *   setTopratedMovies: Function,
 *   cast: Array,
 *   preferredMovies: Array,
 *   setPreferredMovies: Function,
 *   ratedMovies: Array,
 *   setRatedMovies: Function,
 *   loading: boolean,
 *   setLoading: Function,
 *   recommendationLoading: boolean,
 *   setRecommendationLoading: Function,
 *   tvShowsPopular: Array,
 *   setTvShowsPopular: Function,
 *   tvShowsTopRated: Array,
 *   setTvShowsTopRated: Function,
 *   tvShowsOnAir: Array,
 *   setTvShowsOnAir: Function,
 *   fetchData: Function,
 *   fetchPersonalizedMovies: Function,
 *   rateMovie: Function,
 *   fetchTvShows: Function,
 * }}
 */
export function useMovies(authTokens) {
  const [movies, setMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowplayingMovies, setNowplayingMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topratedMovies, setTopratedMovies] = useState([]);
  const [cast] = useState([]);
  const [preferredMovies, setPreferredMovies] = useState([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [tvShowsPopular, setTvShowsPopular] = useState([]);
  const [tvShowsTopRated, setTvShowsTopRated] = useState([]);
  const [tvShowsOnAir, setTvShowsOnAir] = useState([]);

  const fetchData = async () => {
    try {
      const [
        moviesResponse,
        upcomingResponse,
        nowPlayingResponse,
        trendingResponse,
        topRatedResponse,
      ] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/movie/popular/`),
        fetch(`${API_BASE_URL}/movie/upcoming/`),
        fetch(`${API_BASE_URL}/movie/now_playing/`),
        fetch(`${API_BASE_URL}/movie/trending_today/`),
        fetch(`${API_BASE_URL}/movie/top_rated/`),
      ]);

      let hasData = false;

      if (moviesResponse.status === "fulfilled" && moviesResponse.value.ok) {
        const data = await moviesResponse.value.json();
        setMovies(data);
        hasData = true;
      } else {
        setMovies([]);
      }
      if (upcomingResponse.status === "fulfilled" && upcomingResponse.value.ok) {
        const data = await upcomingResponse.value.json();
        setUpcomingMovies(data);
        hasData = true;
      } else {
        setUpcomingMovies([]);
      }
      if (nowPlayingResponse.status === "fulfilled" && nowPlayingResponse.value.ok) {
        const data = await nowPlayingResponse.value.json();
        setNowplayingMovies(data);
        hasData = true;
      } else {
        setNowplayingMovies([]);
      }
      if (trendingResponse.status === "fulfilled" && trendingResponse.value.ok) {
        const data = await trendingResponse.value.json();
        setTrendingMovies(data);
        hasData = true;
      } else {
        setTrendingMovies([]);
      }
      if (topRatedResponse.status === "fulfilled" && topRatedResponse.value.ok) {
        const data = await topRatedResponse.value.json();
        setTopratedMovies(data);
        hasData = true;
      } else {
        setTopratedMovies([]);
      }

      if (!hasData) {
        console.warn('Backend not available');
        setMovies([]);
        setUpcomingMovies([]);
        setNowplayingMovies([]);
        setTrendingMovies([]);
        setTopratedMovies([]);
      }
    } catch (error) {
      console.error("Error fetching data from backend:", error);
      setMovies([]);
      setUpcomingMovies([]);
      setNowplayingMovies([]);
      setTrendingMovies([]);
      setTopratedMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalizedMovies = async () => {
    if (!authTokens) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/movie/user_recommendations/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authTokens.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch personalized movies");
      }

      if (data.recommendations && data.recommendations.length > 0) {
        setPreferredMovies(data.recommendations);
      } else {
        setPreferredMovies([]);
      }

      if (data.rated_movies && data.rated_movies.length > 0) {
        setRatedMovies(data.rated_movies);
      }
    } catch (error) {
      console.error("Error fetching personalized movies:", error);
      setPreferredMovies([]);
      setRatedMovies([]);
    }
  };

  const rateMovie = async (movieId, rating, feedback) => {
    if (!authTokens) return;

    try {
      const response = await fetch(`${API_BASE_URL}/movie/rate/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movie_id: movieId,
          rating: Number(rating).toFixed(1),
          feedback: feedback || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to rate movie");
      }

      await fetchPersonalizedMovies();
    } catch (error) {
      console.error("Error rating movie:", error);
    }
  };

  const fetchTvShows = async () => {
    try {
      const [popularRes, topRatedRes, onAirRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tv/popular/`),
        fetch(`${API_BASE_URL}/tv/top_rated/`),
        fetch(`${API_BASE_URL}/tv/on_air/`),
      ]);
      if (popularRes.ok) setTvShowsPopular(await popularRes.json());
      if (topRatedRes.ok) setTvShowsTopRated(await topRatedRes.json());
      if (onAirRes.ok) setTvShowsOnAir(await onAirRes.json());
    } catch (error) {
      console.error('Error fetching TV shows:', error);
    }
  };

  return {
    movies, setMovies,
    upcomingMovies, setUpcomingMovies,
    nowplayingMovies, setNowplayingMovies,
    trendingMovies, setTrendingMovies,
    topratedMovies, setTopratedMovies,
    cast,
    preferredMovies, setPreferredMovies,
    ratedMovies, setRatedMovies,
    loading, setLoading,
    recommendationLoading, setRecommendationLoading,
    tvShowsPopular, setTvShowsPopular,
    tvShowsTopRated, setTvShowsTopRated,
    tvShowsOnAir, setTvShowsOnAir,
    fetchData,
    fetchPersonalizedMovies,
    rateMovie,
    fetchTvShows,
  };
}
