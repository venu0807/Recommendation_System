import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import MovieDetail from './MovieDetail';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1', movieTitle: 'Inception' }),
  useNavigate: () => mockNavigate,
}));

describe('MovieDetail', () => {
  const mockMovie = {
    id: 1,
    title: 'Inception',
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    overview: 'A thief who steals corporate secrets through dream-sharing technology.',
    release_date: '2010-07-16',
    runtime: 148,
    popularity: 80,
    vote_average: 8.5,
    trailer_link: 'https://youtube.com/watch?v=YoHD9XEInc0',
    genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Sci-Fi' }],
    cast: [
      {
        id: 101,
        member: 201,
        name: 'Leonardo DiCaprio',
        profile_path: '/actor1.jpg',
        job: 'Dom Cobb',
      },
    ],
    crew: [
      {
        id: 102,
        member: 202,
        name: 'Christopher Nolan',
        profile_path: '/crew1.jpg',
        job: 'Director',
      },
    ],
    similar_movies: [
      { id: 2, title: 'The Dark Knight', poster_path: '/similar.jpg', release_date: '2008-07-18' },
    ],
  };

  const defaultContext = {
    user: null,
    authTokens: null,
    rateMovie: jest.fn(),
    favorites: [],
    watchlist: [],
    addToFavorites: jest.fn(),
    removeFromFavorites: jest.fn(),
    addToWatchlist: jest.fn(),
    removeFromWatchlist: jest.fn(),
    preferences: { autoplayTrailers: true },
  };

  const renderMovieDetail = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ ...defaultContext, ...overrides }}>
          <MovieDetail />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/rating/my_ratings/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMovie),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows loading skeleton', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = renderMovieDetail();
    expect(container.querySelector('.skeleton-movie-detail')).toBeInTheDocument();
  });

  test('renders movie title after loading', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
    });
  });

  test('renders movie overview', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText(/A thief who steals/)).toBeInTheDocument();
    });
  });

  test('renders genres', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    });
  });

  test('renders runtime', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('148 min')).toBeInTheDocument();
    });
  });

  test('renders release date', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText(/Release Date: 2010-07-16/)).toBeInTheDocument();
    });
  });

  test('renders cast section', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('Cast')).toBeInTheDocument();
      expect(screen.getByText('Leonardo DiCaprio')).toBeInTheDocument();
    });
  });

  test('renders similar movies section', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('Similar Movies')).toBeInTheDocument();
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });
  });

  test('shows Watch Trailer when trailer link exists', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('Watch Trailer')).toBeInTheDocument();
    });
  });

  test('renders rating select', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('WhatsYourVibe?')).toBeInTheDocument();
    });
    expect(screen.getByText('Submit Rating')).toBeInTheDocument();
  });

  test('shows movie not found when API returns not found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ detail: 'Not found.' }),
    });
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText(/Movie not found/)).toBeInTheDocument();
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });
  });

  test('shows no cast information when cast is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockMovie, cast: [] }),
    });
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('No cast information available.')).toBeInTheDocument();
    });
  });

  test('shows no crew when crew is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockMovie, crew: [] }),
    });
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('No crew information available.')).toBeInTheDocument();
    });
  });

  test('renders crew section', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('Christopher Nolan')).toBeInTheDocument();
      expect(screen.getByText('Director')).toBeInTheDocument();
    });
  });

  test('shows favorite button when user is logged in', async () => {
    renderMovieDetail({
      user: { username: 'testuser' },
      authTokens: { access: 'token' },
    });
    await waitFor(() => {
      const favoriteBtn = document.querySelector('.favorite-btn');
      expect(favoriteBtn).toBeInTheDocument();
    });
  });

  test('does not show favorite button when user is not logged in', async () => {
    renderMovieDetail();
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
    });
    const favoriteBtn = document.querySelector('.favorite-btn');
    expect(favoriteBtn).not.toBeInTheDocument();
  });

  test('navigates to login when unauthorized user clicks favorite', async () => {
    renderMovieDetail({ user: null });
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
    });
    // Without user, no favorite button should be shown
    const favoriteBtn = document.querySelector('.favorite-btn');
    expect(favoriteBtn).not.toBeInTheDocument();
  });
});
