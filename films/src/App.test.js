import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './components/Context';
import App from './App';

// Mock the UserContext
jest.mock('./components/Context', () => ({
  ...jest.requireActual('./components/Context'),
}));

// Mock fetch to prevent actual network calls
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ results: [] }),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('App routing', () => {
  const renderApp = (initialRoute = '/') =>
    render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <UserContext.Provider
          value={{
            user: null,
            movies: [],
            upcomingMovies: [],
            nowplayingMovies: [],
            trendingMovies: [],
            topratedMovies: [],
            preferredMovies: [],
            ratedMovies: [],
            cast: [],
            loading: false,
            favorites: [],
            watchlist: [],
            notifications: [],
            watchHistory: [],
            searchHistory: [],
            preferences: {
              autoplayTrailers: true,
              showAdultContent: false,
              language: 'en',
              videoQuality: 'hd',
              preferredGenres: [],
              preferredActors: [],
              notInterestedMovies: [],
            },
            recommendationLoading: false,
            tvShowsPopular: [],
            tvShowsTopRated: [],
            tvShowsOnAir: [],
            loginUser: jest.fn(),
            logoutUser: jest.fn(),
            registerUser: jest.fn(),
            addToFavorites: jest.fn(),
            removeFromFavorites: jest.fn(),
            addToWatchlist: jest.fn(),
            removeFromWatchlist: jest.fn(),
            addNotification: jest.fn(),
            addToWatchHistory: jest.fn(),
            addToSearchHistory: jest.fn(),
            updatePreferences: jest.fn(),
            addNotInterestedMovie: jest.fn(),
            setFavorites: jest.fn(),
            setWatchlist: jest.fn(),
            setRecommendationLoading: jest.fn(),
            fetchPersonalizedMovies: jest.fn(),
            updateProfile: jest.fn(),
            fetchUserProfile: jest.fn(),
            fetchTvShows: jest.fn(),
          }}
        >
          <App />
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('renders Footer on home page', () => {
    renderApp('/');
    expect(screen.getByText('Movie Recommender')).toBeInTheDocument();
  });

  test('renders 404 page for unknown routes', () => {
    renderApp('/nonexistent-route');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
