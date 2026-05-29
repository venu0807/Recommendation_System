import React, { createContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMovies } from "../hooks/useMovies";
import { useProfile } from "../hooks/useProfile";
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();

  const auth = useAuth(navigate);
  const movies = useMovies(auth.authTokens);
  const profile = useProfile(auth.authTokens, navigate);

  const { loading } = movies;

  /* ---------- Token refresh + initial load ---------- */

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Fetch initial data on mount
  const fetchDataCallback = useCallback(movies.fetchData, [isLocalhost]);
  useEffect(() => {
    fetchDataCallback();

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Setting loading to false due to timeout fallback");
        movies.setLoading(false);
      }
    }, 30000);

    return () => clearTimeout(timeoutId);
  }, [fetchDataCallback, loading, movies.setLoading]);

  // Fetch favorites when user logs in
  const fetchFavoritesCallback = useCallback(profile.fetchFavorites, [auth.authTokens]);
  useEffect(() => {
    if (auth.authTokens) {
      fetchFavoritesCallback();
    }
  }, [auth.authTokens, fetchFavoritesCallback]);

  // Fetch watchlist when user logs in
  const fetchWatchlistCallback = useCallback(profile.fetchWatchlist, [auth.authTokens]);
  useEffect(() => {
    if (auth.authTokens) {
      fetchWatchlistCallback();
    }
  }, [auth.authTokens, fetchWatchlistCallback]);

  // Fetch personalized movies when user logs in
  const fetchPersonalizedMoviesCallback = useCallback(
    movies.fetchPersonalizedMovies,
    [auth.authTokens]
  );
  useEffect(() => {
    if (auth.authTokens) {
      fetchPersonalizedMoviesCallback();
    }
  }, [auth.authTokens, fetchPersonalizedMoviesCallback]);

  // Fetch user profile on app load if tokens exist
  useEffect(() => {
    if (auth.authTokens) {
      auth.fetchUserProfile();
    }
  }, [auth.authTokens]);

  // Fetch TV shows
  useEffect(() => {
    movies.fetchTvShows();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket for real-time recommendations
  useEffect(() => {
    return profile.connectWebSocket(auth.user, (recommendations) => {
      movies.setPreferredMovies(recommendations);
      profile.setRecommendationLoading(false);
      profile.addNotification("Recommendations updated in real time!", "info");
    });
  }, [auth.user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Token refresh logic
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const refreshToken = async () => {
      if (!isMounted || !auth.authTokens?.refresh) return;
      try {
        await auth.updateToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    };

    if (loading && auth.authTokens?.refresh) {
      refreshToken();
    }

    intervalId = setInterval(refreshToken, 60000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [auth.authTokens, loading]);

  /* ---------- Context value ---------- */

  const contextValue = React.useMemo(
    () => ({
      authTokens: auth.authTokens,
      user: auth.user,
      registerUser: auth.registerUser,
      loginUser: auth.loginUser,
      logoutUser: auth.logoutUser,
      updateToken: auth.updateToken,
      fetchUserProfile: auth.fetchUserProfile,
      updateProfile: async (profileData) => {
        const result = await auth.updateProfile(profileData);
        if (result?.success) {
          profile.addNotification(result.message, 'success');
        } else if (result) {
          profile.addNotification(result.message, 'danger');
        }
        return result;
      },

      movies: movies.movies,
      upcomingMovies: movies.upcomingMovies,
      nowplayingMovies: movies.nowplayingMovies,
      trendingMovies: movies.trendingMovies,
      topratedMovies: movies.topratedMovies,
      preferredMovies: movies.preferredMovies,
      ratedMovies: movies.ratedMovies,
      cast: movies.cast,
      loading,
      recommendationLoading: profile.recommendationLoading,
      setRecommendationLoading: profile.setRecommendationLoading,
      fetchPersonalizedMovies: movies.fetchPersonalizedMovies,
      rateMovie: movies.rateMovie,
      tvShowsPopular: movies.tvShowsPopular,
      tvShowsTopRated: movies.tvShowsTopRated,
      tvShowsOnAir: movies.tvShowsOnAir,
      fetchTvShows: movies.fetchTvShows,

      favorites: profile.favorites,
      setFavorites: profile.setFavorites,
      watchlist: profile.watchlist,
      setWatchlist: profile.setWatchlist,
      addToFavorites: profile.addToFavorites,
      removeFromFavorites: profile.removeFromFavorites,
      addToWatchlist: profile.addToWatchlist,
      removeFromWatchlist: profile.removeFromWatchlist,
      notifications: profile.notifications,
      addNotification: profile.addNotification,
      watchHistory: profile.watchHistory,
      addToWatchHistory: profile.addToWatchHistory,
      searchHistory: profile.searchHistory,
      addToSearchHistory: profile.addToSearchHistory,
      preferences: profile.preferences,
      updatePreferences: profile.updatePreferences,
      addNotInterestedMovie: profile.addNotInterestedMovie,
    }),
    [
      auth.authTokens,
      auth.user,
      auth.updateProfile,
      movies.movies,
      movies.upcomingMovies,
      movies.nowplayingMovies,
      movies.trendingMovies,
      movies.topratedMovies,
      movies.preferredMovies,
      movies.ratedMovies,
      movies.cast,
      movies.tvShowsPopular,
      movies.tvShowsTopRated,
      movies.tvShowsOnAir,
      loading,
      profile.recommendationLoading,
      profile.favorites,
      profile.watchlist,
      profile.notifications,
      profile.watchHistory,
      profile.searchHistory,
      profile.preferences,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading movies...</p>
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};
