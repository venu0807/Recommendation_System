import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import Watchlist from './Watchlist';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Watchlist', () => {
  const mockWatchlist = [
    {
      movie: {
        id: 1,
        title: 'Interstellar',
        poster_path: '/poster1.jpg',
      },
    },
    {
      movie: {
        id: 2,
        title: 'The Matrix',
        poster_path: '/poster2.jpg',
      },
    },
  ];

  const defaultContext = {
    user: { username: 'testuser' },
    authTokens: { access: 'test-token' },
    watchlist: mockWatchlist,
    loading: false,
    setWatchlist: jest.fn(),
  };

  const renderWatchlist = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ ...defaultContext, ...overrides }}>
          <Watchlist />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWatchlist),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to login when user is not authenticated', () => {
    renderWatchlist({ user: null });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows loading skeleton when loading', () => {
    const { container } = renderWatchlist({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
    expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
  });

  test('shows empty state when no watchlist items', () => {
    renderWatchlist({ watchlist: [], authTokens: null });
    expect(screen.getByText('No movies in watchlist yet.')).toBeInTheDocument();
  });

  test('renders watchlist movies', async () => {
    renderWatchlist();
    await waitFor(() => {
      expect(screen.getByText('Interstellar')).toBeInTheDocument();
    });
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
  });

  test('renders poster images', async () => {
    renderWatchlist();
    await waitFor(() => {
      const images = document.querySelectorAll('img');
      expect(images.length).toBe(2);
    });
    const images = document.querySelectorAll('img');
    expect(images[0]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster2.jpg');
  });

  test('links to movie detail page', async () => {
    renderWatchlist();
    await waitFor(() => {
      const links = document.querySelectorAll('a[href*="/movie/"]');
      expect(links.length).toBe(2);
    });
    const links = document.querySelectorAll('a[href*="/movie/"]');
    expect(links[0]).toHaveAttribute('href', '/movie/1/Interstellar');
  });

  test('fetches watchlist on mount', async () => {
    renderWatchlist();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/watchlist/my_watchlist/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });
});
