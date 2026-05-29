import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import Upcoming from './Upcoming';

describe('Upcoming', () => {
  const mockMovies = [
    {
      id: 1,
      title: 'Dune: Part Three',
      poster_path: '/poster1.jpg',
      release_date: '2026-12-18',
      popularity: 95,
      vote_average: 0,
      genres: [{ id: 1, name: 'Sci-Fi' }],
      keywords: [{ id: 1, name: 'space' }],
    },
    {
      id: 2,
      title: 'Avatar 4',
      poster_path: '/poster2.jpg',
      release_date: '2027-12-17',
      popularity: 90,
      vote_average: 0,
      genres: [{ id: 2, name: 'Adventure' }],
      keywords: [{ id: 2, name: 'underwater' }],
    },
  ];

  const renderUpcoming = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            upcomingMovies: mockMovies,
            loading: false,
            ...overrides,
          }}
        >
          <Upcoming />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Action' }]),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows loading skeleton when loading', () => {
    const { container } = renderUpcoming({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('renders movie titles', () => {
    renderUpcoming();
    expect(screen.getByText('Dune: Part Three')).toBeInTheDocument();
    expect(screen.getByText('Avatar 4')).toBeInTheDocument();
  });

  test('renders release dates', () => {
    renderUpcoming();
    expect(screen.getByText('2026-12-18')).toBeInTheDocument();
    expect(screen.getByText('2027-12-17')).toBeInTheDocument();
  });

  test('renders poster images', () => {
    renderUpcoming();
    const images = document.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster1.jpg');
  });

  test('links to movie detail page', () => {
    renderUpcoming();
    const links = document.querySelectorAll('a[href*="/movie/"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/movie/1/Dune:-Part-Three');
  });

  test('renders SortFilter component', () => {
    renderUpcoming();
    expect(screen.getByText('Popularity (Asc)')).toBeInTheDocument();
    expect(screen.getByText('Filter by Genre')).toBeInTheDocument();
  });

  test('fetches genres and keywords on mount', async () => {
    renderUpcoming();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/genre/'), expect.anything());
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/keyword/'), expect.anything());
    });
  });
});
