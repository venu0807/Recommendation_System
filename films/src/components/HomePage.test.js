import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './Context';
import HomePage from './HomePage';

describe('HomePage', () => {
  const mockMovie = {
    id: 1,
    title: 'Test Movie',
    backdrop_path: '/test.jpg',
    poster_path: '/poster.jpg',
    overview: 'A great test movie',
    release_date: '2024-01-15',
    popularity: 100,
  };

  const defaultContext = {
    trendingMovies: [mockMovie],
    upcomingMovies: [mockMovie],
    preferredMovies: [],
    user: null,
    loading: false,
  };

  const renderHomePage = (contextOverrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ ...defaultContext, ...contextOverrides }}>
          <HomePage />
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('shows skeleton loading when loading is true', () => {
    const { container } = renderHomePage({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton-movie-card').length).toBe(8);
  });

  test('renders hero section with featured movie', async () => {
    renderHomePage();
    await waitFor(() => {
      // Test Movie appears in hero h1 AND in trending/upcoming cards — check for multiple
      expect(screen.getAllByText('Test Movie').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Watch Now')).toBeInTheDocument();
  });

  test('shows Get Started link when user is not logged in', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Watch Now')).toBeInTheDocument();
    });
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.queryByText('Browse Movies')).not.toBeInTheDocument();
  });

  test('shows Browse Movies link when user is logged in', async () => {
    renderHomePage({ user: { username: 'testuser' } });
    await waitFor(() => {
      expect(screen.getByText('Watch Now')).toBeInTheDocument();
    });
    expect(screen.getByText('Browse Movies')).toBeInTheDocument();
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
  });

  test('renders Trending Now section', () => {
    renderHomePage();
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
    // 'View All' appears in both Trending and Coming Soon sections
    expect(screen.getAllByText('View All').length).toBeGreaterThanOrEqual(1);
  });

  test('renders Coming Soon section', () => {
    renderHomePage();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  test('shows CTA section when user is not logged in', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Watch Now')).toBeInTheDocument();
    });
    expect(screen.getByText('Ready to Discover Amazing Movies?')).toBeInTheDocument();
    expect(screen.getByText('Sign Up Free')).toBeInTheDocument();
    expect(screen.getByText('Already Have an Account?')).toBeInTheDocument();
  });

  test('hides CTA section when user is logged in', async () => {
    renderHomePage({ user: { username: 'testuser' }, preferredMovies: [mockMovie] });
    await waitFor(() => {
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });
    expect(screen.queryByText('Ready to Discover Amazing Movies?')).not.toBeInTheDocument();
  });

  test('shows personalized recommendations when user has preferred movies', async () => {
    renderHomePage({
      user: { username: 'testuser' },
      preferredMovies: [mockMovie],
    });
    await waitFor(() => {
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });
  });

  test('renders features section', () => {
    renderHomePage();
    expect(screen.getByText('AI-Powered Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Personal Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Community Features')).toBeInTheDocument();
  });

  test('Watch Now link goes to movie detail page', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Watch Now')).toBeInTheDocument();
    });
    const watchNowLink = screen.getByText('Watch Now').closest('a');
    expect(watchNowLink).toHaveAttribute('href', '/movie/1/Test-Movie');
  });
});
