import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => {
    return localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null;
  });

  const [user, setUser] = useState(() => {
    return localStorage.getItem("authTokens")
      ? jwtDecode(localStorage.getItem("authTokens"))
      : null;
  });

  const [movies, setMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowplayingMovies, setNowplayingMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topratedMovies, setTopratedMovies] = useState([]);
  const [cast, setCast] = useState([]);
  const [preferredMovies, setPreferredMovies] = useState([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
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

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstname: "",
    lastname: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

 

  const registerUser = async (e) => {
    e.preventDefault();
    const { username, email, firstname, lastname, password, confirmPassword } =
      formData;

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
      body: JSON.stringify({
        username: e.target.username.value,
        password: e.target.password.value,
      }),
    });

    const data = await response.json();

    if (response.status === 200) {
      setAuthTokens(data);
      setUser(jwtDecode(data.access)); // Ensure this is correctly decoding the user info
      localStorage.setItem("authTokens", JSON.stringify(data));
      navigate("/");
    } else {
      alert("Something went wrong!");
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/");
  };

  const updateToken = async () => {
    console.log("Update Token Called!");
    try {
      // Only try to refresh if we have a refresh token
      if (!authTokens?.refresh) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      localStorage.setItem("authTokens", JSON.stringify(data));

      if (loading) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logoutUser();
    }
  };

  // Static fallback movie list for live demo
  const staticMovies = [
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
  ];

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
      const [
        moviesResponse,
        upcomingResponse,
        nowPlayingResponse,
        trendingResponse,
        topRatedResponse,
      ] = await Promise.allSettled([
        fetch("http://localhost:8000/movie/popular/"),
        fetch("http://localhost:8000/movie/upcoming/"),
        fetch("http://localhost:8000/movie/now_playing/"),
        fetch("http://localhost:8000/movie/trending_today/"),
        fetch("http://localhost:8000/movie/top_rated/"),
      ]);

      // Handle responses and set state
      if (moviesResponse.status === "fulfilled" && moviesResponse.value.ok) {
        const data = await moviesResponse.value.json();
        setMovies(data);
      } else {
        setMovies(staticMovies); // fallback for demo
      }
      if (upcomingResponse.status === "fulfilled" && upcomingResponse.value.ok) {
        const data = await upcomingResponse.value.json();
        setUpcomingMovies(data);
      }
      if (nowPlayingResponse.status === "fulfilled" && nowPlayingResponse.value.ok) {
        const data = await nowPlayingResponse.value.json();
        setNowplayingMovies(data);
      }
      if (trendingResponse.status === "fulfilled" && trendingResponse.value.ok) {
        const data = await trendingResponse.value.json();
        setTrendingMovies(data);
      }
      if (topRatedResponse.status === "fulfilled" && topRatedResponse.value.ok) {
        const data = await topRatedResponse.value.json();
        setTopratedMovies(data);
      }
    } catch (error) {
      setMovies(staticMovies); // fallback for demo
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalizedMovies = async () => {
    if (!authTokens) return;

    try {
      console.log("Fetching personalized movies...");
      const response = await fetch(
        "http://localhost:8000/movie/user_recommendations/",
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
      const response = await fetch("http://localhost:8000/movie/rate/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movie_id: movieId,
          rating: parseInt(rating),
          feedback: feedback || "",
        }),
      });

      const data = await response.json();
      console.log("Rate response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to rate movie");
      }

      // Fetch updated recommendations after rating
      await fetchPersonalizedMovies();
    } catch (error) {
      console.error("Error rating movie:", error);
    }
  };

  const fetchFavorites = async () => {
    if (!authTokens) return;
    
    try {
        const response = await fetch("http://localhost:8000/favorites/my_favorites/", {
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

  // Add this useEffect to fetch favorites when user logs in
  useEffect(() => {
      if (authTokens) {
          fetchFavorites();
      }
  }, [authTokens]);

  const addToFavorites = async (movieId) => {
    if (!authTokens) {
        addNotification('Please login to add favorites', 'warning');
        navigate('/login');
        return false;
    }

    try {
        const response = await fetch("http://localhost:8000/favorites/add/", {
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
            await fetchFavorites(); // Refresh the favorites list
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
        const response = await fetch(`http://localhost:8000/favorites/${movieId}/remove/`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${authTokens.access}`,
            },
        });

        if (response.ok) {
            // Update the favorites state by filtering out the removed movie
            const updatedFavorites = favorites.filter(fav => fav.movie.id !== movieId);
            setFavorites(updatedFavorites);
            addNotification('Removed from favorites', 'info');
            await fetchFavorites(); // Add this line to refresh the favorites list
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
      const response = await fetch("http://localhost:8000/watchlist/my_watchlist/", {
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

// Add this useEffect to fetch watchlist when user logs in
useEffect(() => {
    if (authTokens) {
        fetchWatchlist();
    }
}, [authTokens]);

const addToWatchlist = async (movieId) => {
    if (!authTokens) {
        addNotification('Please login to add to watchlist', 'warning');
        navigate('/login');
        return false;
    }

    try {
        const response = await fetch("http://localhost:8000/watchlist/add/", {
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
            await fetchWatchlist(); // Refresh the watchlist
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
        const response = await fetch(`http://localhost:8000/watchlist/${movieId}/remove/`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${authTokens.access}`,
            },
        });

        if (response.ok) {
            const updatedWatchlist = watchlist.filter(item => item.movie.id !== movieId);
            setWatchlist(updatedWatchlist);
            addNotification('Removed from watchlist', 'info');
            await fetchWatchlist(); // Refresh the watchlist
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

  useEffect(() => {
    if (authTokens) {
      fetchPersonalizedMovies();
    }
  }, [authTokens]);

  // Add debounced token refresh
  const debouncedUpdateToken = () => {
    let timeoutId;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        updateToken();
      }, 100);
    };
  };

  const handleTokenRefresh = debouncedUpdateToken();

  // Update useEffect for token refresh
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const refreshToken = async () => {
      if (!isMounted || !authTokens?.refresh) return;
      try {
        await handleTokenRefresh();
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    };

    if (loading) {
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

  // Add this useEffect
  useEffect(() => {
    fetchData();
  }, []);

  // Add this near your other useEffects
  useEffect(() => {
    if (user) {
      console.log("Auth state changed:", {
        user: user,
        preferredMovies: preferredMovies.length,
        ratedMovies: ratedMovies.length,
      });
    }
  }, [user, preferredMovies, ratedMovies]);

  const contextValue = {
    authTokens,
    user,
    registerUser,
    handleChange,
    formData,
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
    setFavorites, // Add this line to expose setFavorites
    setWatchlist,
  };

  return (
    <ErrorBoundary>
      <UserContext.Provider value={contextValue}>
        {loading ? null : children}
      </UserContext.Provider>
    </ErrorBoundary>
  );
};
