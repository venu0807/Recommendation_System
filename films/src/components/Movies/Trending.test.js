import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import Trending from './Trending';

describe('Trending', () => {
  const mockTrendingMovies = [
    {
      id: 1,
      title: 'Dune: Part Three',
      poster_path: '/poster1.jpg',
      release_date: '2026-12-18',
      popularity: 95,
    },
    {
      id: 2,
      title: 'Avatar 4',
      poster_path: '/poster2.jpg',
      release_date: '2027-12-17',
      popularity: 90,
    },
  ];

  const mockPreferredMovies = [
    {
      id: 3,
      title: 'Recommended Movie',
      poster_path: '/poster3.jpg',
      release_date: '2025-01-01',
      popularity: 99,
    },
  ];

  const mockRatedMovies = [
    {
      movie: {
        id: 4,
        title: 'Rated Movie',
        poster_path: '/poster4.jpg',
        release_date: '2024-06-15',
      },
      rating: 8,
    },
  ];

  const renderTrending = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            trendingMovies: mockTrendingMovies,
            loading: false,
            user: null,
            preferredMovies: [],
            ratedMovies: [],
            recommendationLoading: false,
            ...overrides,
          }}
        >
          <Trending />
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('shows loading skeleton when loading', () => {
    const { container } = renderTrending({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('shows recommendation spinner when recommendationLoading', () => {
    renderTrending({ recommendationLoading: true, loading: false });
    expect(screen.getByText('Updating recommendations...')).toBeInTheDocument();
  });

  test('shows "Trending Movies" heading when user not logged in', () => {
    renderTrending();
    expect(screen.getByText('Trending Movies')).toBeInTheDocument();
  });

  test('shows "Your Movies" heading when user logged in', () => {
    renderTrending({
      user: { username: 'testuser' },
      preferredMovies: mockPreferredMovies,
    });
    expect(screen.getByText('Your Movies')).toBeInTheDocument();
  });

  test('renders trending movies', () => {
    renderTrending();
    expect(screen.getByText('Dune: Part Three')).toBeInTheDocument();
    expect(screen.getByText('Avatar 4')).toBeInTheDocument();
  });

  test('renders preferred movies when user logged in', () => {
    renderTrending({
      user: { username: 'testuser' },
      preferredMovies: mockPreferredMovies,
      trendingMovies: mockTrendingMovies,
    });
    expect(screen.getByText('Recommended Movie')).toBeInTheDocument();
  });

  test('renders rated movies when user logged in', () => {
    renderTrending({
      user: { username: 'testuser' },
      ratedMovies: mockRatedMovies,
    });
    expect(screen.getByText('Rated Movie')).toBeInTheDocument();
    expect(screen.getByText('Your Rating: 8/10')).toBeInTheDocument();
  });

  test('shows empty state when no movies available', () => {
    renderTrending({ trendingMovies: [] });
    expect(screen.getByText('No movies available')).toBeInTheDocument();
    expect(screen.getByText('Please try again later')).toBeInTheDocument();
  });

  test('links to movie detail page', () => {
    renderTrending();
    const links = document.querySelectorAll('a[href*="/movie/"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/movie/1/Dune:-Part-Three');
  });

  test('shows release dates on movie cards', () => {
    renderTrending();
    expect(screen.getByText('2026-12-18')).toBeInTheDocument();
    expect(screen.getByText('2027-12-17')).toBeInTheDocument();
  });
});
