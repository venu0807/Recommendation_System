import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import Popular from './Popular';

describe('Popular', () => {
  const mockMovies = [
    {
      id: 1,
      title: 'Inception',
      poster_path: '/poster1.jpg',
      release_date: '2010-07-16',
      popularity: 80,
      vote_average: 8.5,
      genres: [{ id: 1, name: 'Action' }],
      keywords: [{ id: 1, name: 'heist' }],
    },
    {
      id: 2,
      title: 'The Dark Knight',
      poster_path: '/poster2.jpg',
      release_date: '2008-07-18',
      popularity: 90,
      vote_average: 9.0,
      genres: [{ id: 2, name: 'Drama' }],
      keywords: [{ id: 2, name: 'superhero' }],
    },
  ];

  const renderPopular = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            movies: mockMovies,
            loading: false,
            ...overrides,
          }}
        >
          <Popular />
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
    const { container } = renderPopular({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('renders movie titles', () => {
    renderPopular();
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
  });

  test('renders release dates', () => {
    renderPopular();
    expect(screen.getByText('2010-07-16')).toBeInTheDocument();
    expect(screen.getByText('2008-07-18')).toBeInTheDocument();
  });

  test('renders poster images', () => {
    renderPopular();
    const images = document.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster1.jpg');
  });

  test('links to movie detail page', () => {
    renderPopular();
    const links = document.querySelectorAll('a[href*="/movie/"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/movie/1/Inception');
  });

  test('renders SortFilter component', () => {
    renderPopular();
    expect(screen.getByText('Popularity (Asc)')).toBeInTheDocument();
    expect(screen.getByText('Filter by Genre')).toBeInTheDocument();
  });

  test('fetches genres on mount', async () => {
    renderPopular();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/genre/'));
    });
  });

  test('fetches keywords on mount', async () => {
    renderPopular();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/keyword/'));
    });
  });
});
