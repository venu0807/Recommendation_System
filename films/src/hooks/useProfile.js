import { useState, useCallback, useRef, useEffect } from "react";
import API_BASE_URL from "../config";

/**
 * Profile and personalization hook for favorites, watchlist, notifications, and WebSocket.
 * @param {object|null} authTokens - JWT auth tokens
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @returns {{
 *   favorites: Array,
 *   setFavorites: Function,
 *   watchlist: Array,
 *   setWatchlist: Function,
 *   notifications: Array,
 *   watchHistory: Array,
 *   searchHistory: Array,
 *   preferences: object,
 *   recommendationLoading: boolean,
 *   setRecommendationLoading: Function,
 *   addToFavorites: Function,
 *   removeFromFavorites: Function,
 *   fetchFavorites: Function,
 *   addToWatchlist: Function,
 *   removeFromWatchlist: Function,
 *   fetchWatchlist: Function,
 *   addNotification: Function,
 *   addToWatchHistory: Function,
 *   addToSearchHistory: Function,
 *   updatePreferences: Function,
 *   addNotInterestedMovie: Function,
 *   connectWebSocket: Function,
 * }}
 */
export function useProfile(authTokens, navigate) {
  const wsRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [preferences, setPreferences] = useState({
    autoplayTrailers: true,
    showAdultContent: false,
    language: "en",
    videoQuality: "hd",
    preferredGenres: [],
    preferredActors: [],
    notInterestedMovies: [],
  });
  const [recommendationLoading, setRecommendationLoading] = useState(true);

  const addNotification = useCallback((message, type = "info") => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
    };
    setNotifications((prev) => [notification, ...prev]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  }, []);

  /* ---------- Favorites ---------- */

  const fetchFavorites = useCallback(async () => {
    if (!authTokens) return;
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/my_favorites/`, {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setFavorites(await response.json());
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  }, [authTokens]);

  const addToFavorites = async (movieId) => {
    if (!authTokens) {
      addNotification("Please login to add favorites", "warning");
      navigate("/login");
      return false;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({ movie_id: movieId }),
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites((prev) => [...prev, data]);
        addNotification("Added to favorites!", "success");
        await fetchFavorites();
        return true;
      }
      throw new Error("Failed to add to favorites");
    } catch (error) {
      console.error("Error adding to favorites:", error);
      addNotification("Failed to add to favorites", "error");
      return false;
    }
  };

  const removeFromFavorites = async (movieId) => {
    if (!authTokens) return false;
    try {
      const response = await fetch(
        `${API_BASE_URL}/favorites/${movieId}/remove/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authTokens.access}` },
        }
      );
      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.movie.id !== movieId));
        addNotification("Removed from favorites", "info");
        await fetchFavorites();
        return true;
      }
      throw new Error("Failed to remove from favorites");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      addNotification("Failed to remove from favorites", "error");
      return false;
    }
  };

  /* ---------- Watchlist ---------- */

  const fetchWatchlist = useCallback(async () => {
    if (!authTokens) return;
    try {
      const response = await fetch(`${API_BASE_URL}/watchlist/my_watchlist/`, {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setWatchlist(await response.json());
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
  }, [authTokens]);

  const addToWatchlist = async (movieId) => {
    if (!authTokens) {
      addNotification("Please login to add to watchlist", "warning");
      navigate("/login");
      return false;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/watchlist/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({ movie_id: movieId }),
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist((prev) => [...prev, data]);
        addNotification("Added to watchlist!", "success");
        await fetchWatchlist();
        return true;
      }
      throw new Error("Failed to add to watchlist");
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      addNotification("Failed to add to watchlist", "error");
      return false;
    }
  };

  const removeFromWatchlist = async (movieId) => {
    if (!authTokens) return false;
    try {
      const response = await fetch(
        `${API_BASE_URL}/watchlist/${movieId}/remove/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authTokens.access}` },
        }
      );
      if (response.ok) {
        setWatchlist((prev) =>
          prev.filter((item) => item.movie.id !== movieId)
        );
        addNotification("Removed from watchlist", "info");
        await fetchWatchlist();
        return true;
      }
      throw new Error("Failed to remove from watchlist");
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      addNotification("Failed to remove from watchlist", "error");
      return false;
    }
  };

  /* ---------- History & Preferences ---------- */

  const addToWatchHistory = (movie) => {
    setWatchHistory((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists ? prev : [movie, ...prev].slice(0, 50);
    });
  };

  const addToSearchHistory = (query) => {
    setSearchHistory((prev) => {
      const exists = prev.some((q) => q === query);
      return exists ? prev : [query, ...prev].slice(0, 20);
    });
  };

  const updatePreferences = (newPreferences) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }));
    localStorage.setItem("userPreferences", JSON.stringify(newPreferences));
  };

  const addNotInterestedMovie = (movieId) => {
    setPreferences((prev) => ({
      ...prev,
      notInterestedMovies: [...prev.notInterestedMovies, movieId],
    }));
  };

  /* ---------- WebSocket ---------- */

  // WebSocket connection for real-time recommendations
  // Note: user dependency is passed from Context.js
  const connectWebSocket = useCallback(
    (user, onRecommendations) => {
      if (!user) return;
      const wsBase = API_BASE_URL.replace(/^http/, "ws");
      const wsUrl = `${wsBase}/ws/recommendations/`;
      wsRef.current = new window.WebSocket(wsUrl);

      wsRef.current.onopen = () => {};
      wsRef.current.onclose = () => {};
      wsRef.current.onerror = (e) => {
        console.error("WebSocket error:", e);
      };
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.recommendations) {
            onRecommendations(data.recommendations);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };
      return () => {
        if (wsRef.current) wsRef.current.close();
      };
    },
    []
  );

  return {
    favorites,
    setFavorites,
    watchlist,
    setWatchlist,
    notifications,
    watchHistory,
    searchHistory,
    preferences,
    recommendationLoading,
    setRecommendationLoading,
    addToFavorites,
    removeFromFavorites,
    fetchFavorites,
    addToWatchlist,
    removeFromWatchlist,
    fetchWatchlist,
    addNotification,
    addToWatchHistory,
    addToSearchHistory,
    updatePreferences,
    addNotInterestedMovie,
    connectWebSocket,
  };
}
