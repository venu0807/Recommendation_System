import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import ErrorBoundary from './ErrorBoundary';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const wsRef = useRef(null);
  const [authTokens, setAuthTokens] = useState(null);
  const [user, setUser] = useState(null);

  const [movies, setMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowplayingMovies, setNowplayingMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topratedMovies, setTopratedMovies] = useState([]);
  const [cast] = useState([]);
  const [preferredMovies, setPreferredMovies] = useState([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [tvShowsPopular, setTvShowsPopular] = useState([]);
  const [tvShowsTopRated, setTvShowsTopRated] = useState([]);
  const [tvShowsOnAir, setTvShowsOnAir] = useState([]);
  
  const navigate = useNavigate();
  
  const [preferences, setPreferences] = useState({
    autoplayTrailers: true,
    showAdultContent: false,
    language: "en",
    videoQuality: "hd",
    preferredGenres: [],
    preferredActors: [],
    notInterestedMovies: [],
  });



  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!authTokens?.access) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/user/me/', {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setUser((prev) => ({ ...prev, profile: profileData }));
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Update user profile (avatar, bio, etc.)
  const updateProfile = async (profileData) => {
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    try {
      // First get the current user profile to get the ID
      const profileResponse = await fetch('http://127.0.0.1:8000/api/user/me/', {
        headers: {
          Authorization: `Bearer ${authTokens?.access}`,
        },
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to get current profile');
      }
      
      const currentProfile = await profileResponse.json();
      
      // Update using the ViewSet endpoint
      const response = await fetch(`http://127.0.0.1:8000/user/${currentProfile.id}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authTokens?.access}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const updated = await response.json();
        setUser((prev) => ({ ...prev, profile: updated }));
        addNotification('Profile updated successfully', 'success');
      } else {
        addNotification('Failed to update profile', 'danger');
      }
    } catch (err) {
      addNotification('Error updating profile', 'danger');
      console.error('Error updating profile:', err);
    }
  };



  const registerUser = async (e, registerData) => {
    e.preventDefault();
    const { username, email, firstname, lastname, password, confirmPassword } =
      registerData;

    if (
      !username ||
      !firstname ||
      !lastname ||
      !password ||
      password !== confirmPassword
    ) {
      console.error("Invalid Data");
      return;
    }

    try {
      const registerResponse = await fetch("http://127.0.0.1:8000/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
          firstname: firstname,
          lastname: lastname,
          email: email,
        }),
      });

      if (registerResponse.ok) {
        const data = await registerResponse.json();
        navigate("/login");
        console.log("Registration successful", data);
      } else {
        console.error("Registration failed");
      }
    } catch (error) {
      console.error("Error during registration", error);
    }
  };

  const loginUser = async (e) => {
    e.preventDefault();
    const response = await fetch("http://127.0.0.1:8000/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: e.target.username.value,
        password: e.target.password.value,
      }),
    });

    const data = await response.json();

    if (response.status === 200) {
      setAuthTokens(data);
      setUser(jwtDecode(data.access));
      await fetchUserProfile();
      navigate("/");
    } else {
      alert("Something went wrong!");
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    navigate("/");
  };

  const updateToken = async () => {
    console.log("Update Token Called!");
    try {
      if (!authTokens?.refresh) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refresh: authTokens.refresh }),
      });

      if (!response.ok) {
        console.error("Token refresh failed:", response.status);
        logoutUser();
        return;
      }

      const data = await response.json();
      setAuthTokens(data);
      setUser(jwtDecode(data.access));

      if (loading) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logoutUser();
    }
  };

  // Static fallback movie list for live demo
  const staticMovies = React.useMemo(() => [
    {
      id: 1,
      title: "Inception",
      poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      release_date: "2010-07-16",
      popularity: 80,
    },
    {
      id: 2,
      title: "The Dark Knight",
      poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      release_date: "2008-07-18",
      popularity: 90,
    },
    {
      id: 3,
      title: "Interstellar",
      poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      release_date: "2014-11-07",
      popularity: 85,
    },
    {
      id: 4,
      title: "The Matrix",
      poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      release_date: "1999-03-31",
      popularity: 75,
    },
    {
      id: 5,
      title: "Pulp Fiction",
      poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      release_date: "1994-10-14",
      popularity: 70,
    },
    {
      id: 6,
      title: "Fight Club",
      poster_path: "/a26cQPRhJPX6GbWfQbvZdrrp9j9.jpg",
      release_date: "1999-10-15",
      popularity: 65,
    },
    {
      id: 7,
      title: "Forrest Gump",
      poster_path: "/clolk7rB5lAjs41SD0Vt6IXYLMm.jpg",
      release_date: "1994-07-06",
      popularity: 60,
    },
    {
      id: 8,
      title: "The Shawshank Redemption",
      poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      release_date: "1994-09-23",
      popularity: 95,
    },
    {
      id: 9,
      title: "The Godfather",
      poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      release_date: "1972-03-24",
      popularity: 88,
    },
    {
      id: 10,
      title: "The Lord of the Rings: The Fellowship of the Ring",
      poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
      release_date: "2001-12-19",
      popularity: 78,
    },
    {
      id: 11,
      title: "Avengers: Endgame",
      poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      release_date: "2019-04-26",
      popularity: 99,
    },
  ], []);

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  const fetchData = async () => {
    if (!isLocalhost) {
      setMovies(staticMovies);
      setUpcomingMovies(staticMovies);
      setNowplayingMovies(staticMovies);
      setTrendingMovies(staticMovies);
      setTopratedMovies(staticMovies);
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to fetch data from backend...');
      const [
        moviesResponse,
        upcomingResponse,
        nowPlayingResponse,
        trendingResponse,
        topRatedResponse,
      ] = await Promise.allSettled([
        fetch(`${process.env.REACT_APP_API_URL}/movie/popular/`),
        fetch(`${process.env.REACT_APP_API_URL}/movie/upcoming/`),
        fetch(`${process.env.REACT_APP_API_URL}/movie/now_playing/`),
        fetch(`${process.env.REACT_APP_API_URL}/movie/trending_today/`),
        fetch(`${process.env.REACT_APP_API_URL}/movie/top_rated/`),
      ]);

      let hasData = false;

      if (moviesResponse.status === "fulfilled" && moviesResponse.value.ok) {
        const data = await moviesResponse.value.json();
        setMovies(data);
        hasData = true;
      } else {
        setMovies(staticMovies);
      }
      if (upcomingResponse.status === "fulfilled" && upcomingResponse.value.ok) {
        const data = await upcomingResponse.value.json();
        setUpcomingMovies(data);
        hasData = true;
      } else {
        setUpcomingMovies(staticMovies);
      }
      if (nowPlayingResponse.status === "fulfilled" && nowPlayingResponse.value.ok) {
        const data = await nowPlayingResponse.value.json();
        setNowplayingMovies(data);
        hasData = true;
      } else {
        setNowplayingMovies(staticMovies);
      }
      if (trendingResponse.status === "fulfilled" && trendingResponse.value.ok) {
        const data = await trendingResponse.value.json();
        setTrendingMovies(data);
        hasData = true;
      } else {
        setTrendingMovies(staticMovies);
      }
      if (topRatedResponse.status === "fulfilled" && topRatedResponse.value.ok) {
        const data = await topRatedResponse.value.json();
        setTopratedMovies(data);
        hasData = true;
      } else {
        setTopratedMovies(staticMovies);
      }

      if (!hasData) {
        console.log('Backend not available, using static data');
        setMovies(staticMovies);
        setUpcomingMovies(staticMovies);
        setNowplayingMovies(staticMovies);
        setTrendingMovies(staticMovies);
        setTopratedMovies(staticMovies);
      }
    } catch (error) {
      console.error("Error fetching data from backend, using static data:", error);
      setMovies(staticMovies);
      setUpcomingMovies(staticMovies);
      setNowplayingMovies(staticMovies);
      setTrendingMovies(staticMovies);
      setTopratedMovies(staticMovies);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalizedMovies = async () => {
    if (!authTokens) return;

    try {
      console.log("Fetching personalized movies...");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/movie/user_recommendations/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authTokens.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch personalized movies");
      }

      if (data.recommendations && data.recommendations.length > 0) {
        console.log(
          "Setting preferred movies:",
          data.recommendations.map((m) => m.title)
        );
        setPreferredMovies(data.recommendations);
      } else {
        console.log("No recommendations available, falling back to trending");
        setPreferredMovies([]);
      }

      if (data.rated_movies && data.rated_movies.length > 0) {
        console.log(
          "Setting rated movies:",
          data.rated_movies.map((m) => m.movie.title)
        );
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
      console.log("Rating movie:", { movieId, rating, feedback });
      const response = await fetch(`${process.env.REACT_APP_API_URL}/movie/rate/`, {
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
      console.log("Rate response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to rate movie");
      }

      await fetchPersonalizedMovies();
    } catch (error) {
      console.error("Error rating movie:", error);
    }
  };

  const fetchFavorites = async () => {
    if (!authTokens) return;
    
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/favorites/my_favorites/`, {
            headers: {
                'Authorization': `Bearer ${authTokens.access}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            setFavorites(data);
        }
    } catch (error) {
        console.error("Error fetching favorites:", error);
    }
  };

  const addToFavorites = async (movieId) => {
    if (!authTokens) {
        addNotification('Please login to add favorites', 'warning');
        navigate('/login');
        return false;
    }

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/favorites/add/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authTokens.access}`,
            },
            body: JSON.stringify({ movie_id: movieId }),
        });

        if (response.ok) {
            const data = await response.json();
            setFavorites(prev => [...prev, data]);
            addNotification('Added to favorites!', 'success');
            await fetchFavorites();
            return true;
        }
        throw new Error('Failed to add to favorites');
    } catch (error) {
        console.error("Error adding to favorites:", error);
        addNotification('Failed to add to favorites', 'error');
        return false;
    }
  };

  const removeFromFavorites = async (movieId) => {
    if (!authTokens) return false;

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/favorites/${movieId}/remove/`, {
            method: `DELETE",
            headers: {
                Authorization: `Bearer ${authTokens.access}`,
            },
        });

        if (response.ok) {
            const updatedFavorites = favorites.filter(fav => fav.movie.id !== movieId);
            setFavorites(updatedFavorites);
            addNotification('Removed from favorites', 'info');
            await fetchFavorites();
            return true;
        }
        throw new Error('Failed to remove from favorites');
    } catch (error) {
        console.error("Error removing from favorites:", error);
        addNotification('Failed to remove from favorites', 'error');
        return false;
    }
  };

  const fetchWatchlist = async () => {
    if (!authTokens) return;
    
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/watchlist/my_watchlist/`, {
            headers: {
                'Authorization': `Bearer ${authTokens.access}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            setWatchlist(data);
        }
    } catch (error) {
        console.error("Error fetching watchlist:", error);
    }
  };

  const addToWatchlist = async (movieId) => {
    if (!authTokens) {
        addNotification('Please login to add to watchlist', 'warning');
        navigate('/login');
        return false;
    }

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/watchlist/add/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authTokens.access}`,
            },
            body: JSON.stringify({ movie_id: movieId }),
        });

        if (response.ok) {
            const data = await response.json();
            setWatchlist(prev => [...prev, data]);
            addNotification('Added to watchlist!', 'success');
            await fetchWatchlist();
            return true;
        }
        throw new Error('Failed to add to watchlist');
    } catch (error) {
        console.error("Error adding to watchlist:", error);
        addNotification('Failed to add to watchlist', 'error');
        return false;
    }
  };

  const removeFromWatchlist = async (movieId) => {
    if (!authTokens) return false;

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/watchlist/${movieId}/remove/`, {
            method: `DELETE",
            headers: {
                Authorization: `Bearer ${authTokens.access}`,
            },
        });

        if (response.ok) {
            const updatedWatchlist = watchlist.filter(item => item.movie.id !== movieId);
            setWatchlist(updatedWatchlist);
            addNotification('Removed from watchlist', 'info');
            await fetchWatchlist();
            return true;
        }
        throw new Error('Failed to remove from watchlist');
    } catch (error) {
        console.error("Error removing from watchlist:", error);
        addNotification('Failed to remove from watchlist', 'error');
        return false;
    }
  };

  const addNotification = (message, type = "info") => {
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
  };

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

  const fetchTvShows = async () => {
    try {
      const [popularRes, topRatedRes, onAirRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/tv/popular/`),
        fetch(`${process.env.REACT_APP_API_URL}/tv/top_rated/`),
        fetch(`${process.env.REACT_APP_API_URL}/tv/on_air/`),
      ]);
      if (popularRes.ok) setTvShowsPopular(await popularRes.json());
      if (topRatedRes.ok) setTvShowsTopRated(await topRatedRes.json());
      if (onAirRes.ok) setTvShowsOnAir(await onAirRes.json());
    } catch (error) {
      console.error('Error fetching TV shows:', error);
    }
  };

  // WebSocket connection for real-time recommendations
  useEffect(() => {
    if (!user) return;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/recommendations/`;
    wsRef.current = new window.WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected for recommendations');
    };
    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
    wsRef.current.onerror = (e) => {
      console.error('WebSocket error:', e);
    };
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.recommendations) {
          setPreferredMovies(data.recommendations);
          setRecommendationLoading(false);
          addNotification('Recommendations updated in real time!', 'info');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [user]);

  // Fetch favorites when user logs in
  const fetchFavoritesCallback = useCallback(fetchFavorites, [authTokens]);
  useEffect(() => {
      if (authTokens) {
          fetchFavoritesCallback();
      }
  }, [authTokens, fetchFavoritesCallback]);

  // Fetch watchlist when user logs in
  const fetchWatchlistCallback = useCallback(fetchWatchlist, [authTokens]);
  useEffect(() => {
      if (authTokens) {
          fetchWatchlistCallback();
      }
  }, [authTokens, fetchWatchlistCallback]);

  // Fetch personalized movies when user logs in
  const fetchPersonalizedMoviesCallback = useCallback(fetchPersonalizedMovies, [authTokens]);
  useEffect(() => {
    if (authTokens) {
      fetchPersonalizedMoviesCallback();
    }
  }, [authTokens, fetchPersonalizedMoviesCallback]);

  // Fetch user profile on app load if tokens exist
  useEffect(() => {
    if (authTokens) {
      fetchUserProfile();
    }
  }, [authTokens]);

  // Fetch initial data
  const fetchDataCallback = useCallback(fetchData, [isLocalhost, staticMovies]);
  useEffect(() => {
    fetchDataCallback();
    
    // Fallback: ensure loading is set to false even if fetchData fails
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Setting loading to false due to timeout fallback');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
  }, [fetchDataCallback, loading]);

  // Fetch TV shows
  useEffect(() => {
    fetchTvShows();
  }, []);

  // Token refresh logic
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const refreshToken = async () => {
      if (!isMounted || !authTokens?.refresh) return;
      try {
        await updateToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    };

    if (loading && authTokens?.refresh) {
      refreshToken();
    }

    intervalId = setInterval(refreshToken, 60000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [authTokens, loading]);

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log("Auth state changed:", {
        user: user,
        preferredMovies: preferredMovies.length,
        ratedMovies: ratedMovies.length,
      });
    }
  }, [user, preferredMovies, ratedMovies]);

  const contextValue = React.useMemo(() => ({
    authTokens,
    user,
    registerUser,
    loginUser,
    logoutUser,
    updateToken,
    rateMovie,
    movies,
    upcomingMovies,
    nowplayingMovies,
    trendingMovies,
    topratedMovies,
    preferredMovies,
    ratedMovies,
    cast,
    loading,
    favorites,
    watchlist,
    addToFavorites,
    removeFromFavorites,
    addToWatchlist,
    removeFromWatchlist,
    notifications,
    addNotification,
    watchHistory,
    addToWatchHistory,
    searchHistory,
    addToSearchHistory,
    preferences,
    updatePreferences,
    addNotInterestedMovie,
    setFavorites,
    setWatchlist,
    recommendationLoading,
    setRecommendationLoading,
    fetchPersonalizedMovies,
    updateProfile,
    fetchUserProfile,
    tvShowsPopular,
    tvShowsTopRated,
    tvShowsOnAir,
    fetchTvShows,
  }), [
    authTokens, user, movies, upcomingMovies, nowplayingMovies, trendingMovies, 
    topratedMovies, preferredMovies, ratedMovies, cast, loading, favorites, 
    watchlist, notifications, watchHistory, searchHistory, preferences, 
    recommendationLoading, tvShowsPopular, tvShowsTopRated, tvShowsOnAir
  ]);

  console.log('Context render - loading:', loading, 'user:', !!user, 'movies count:', trendingMovies.length);
  
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};
