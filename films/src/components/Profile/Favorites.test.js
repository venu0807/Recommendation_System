import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import Favorites from './Favorites';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Favorites', () => {
  const mockFavorites = [
    {
      movie: {
        id: 1,
        title: 'Inception',
        poster_path: '/poster1.jpg',
      },
    },
    {
      movie: {
        id: 2,
        title: 'The Dark Knight',
        poster_path: '/poster2.jpg',
      },
    },
  ];

  const defaultContext = {
    user: { username: 'testuser' },
    authTokens: { access: 'test-token' },
    favorites: mockFavorites,
    loading: false,
    setFavorites: jest.fn(),
  };

  const renderFavorites = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ ...defaultContext, ...overrides }}>
          <Favorites />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFavorites),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to login when user is not authenticated', () => {
    renderFavorites({ user: null });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows loading skeleton when loading', () => {
    const { container } = renderFavorites({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
    expect(screen.getByText('Your Favorites')).toBeInTheDocument();
  });

  test('shows empty state when no favorites', async () => {
    renderFavorites({ favorites: [] });
    await waitFor(() => {
      expect(screen.getByText('No favorite movies yet.')).toBeInTheDocument();
    });
  });

  test('renders favorite movies', async () => {
    renderFavorites();
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
    });
    expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
  });

  test('renders poster images for favorites', async () => {
    renderFavorites();
    await waitFor(() => {
      const images = document.querySelectorAll('img');
      expect(images.length).toBe(2);
    });
    const images = document.querySelectorAll('img');
    expect(images[0]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster2.jpg');
  });

  test('links to movie detail page', async () => {
    renderFavorites();
    await waitFor(() => {
      const links = document.querySelectorAll('a[href*="/movie/"]');
      expect(links.length).toBe(2);
    });
    const links = document.querySelectorAll('a[href*="/movie/"]');
    expect(links[0]).toHaveAttribute('href', '/movie/1/Inception');
    expect(links[1]).toHaveAttribute('href', '/movie/2/The-Dark-Knight');
  });

  test('fetches favorites on mount', async () => {
    renderFavorites();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/favorites/my_favorites/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });
});
