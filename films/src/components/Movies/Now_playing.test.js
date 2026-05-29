import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import Nowplaying from './Now_playing';

describe('Nowplaying', () => {
  const mockMovies = [
    {
      id: 1,
      title: 'Oppenheimer',
      poster_path: '/poster1.jpg',
      release_date: '2023-07-21',
      popularity: 100,
      vote_average: 8.5,
      genres: [{ id: 1, name: 'Drama' }],
      keywords: [{ id: 1, name: 'history' }],
    },
    {
      id: 2,
      title: 'Barbie',
      poster_path: '/poster2.jpg',
      release_date: '2023-07-21',
      popularity: 95,
      vote_average: 7.5,
      genres: [{ id: 2, name: 'Comedy' }],
      keywords: [{ id: 2, name: 'toy' }],
    },
  ];

  const renderNowplaying = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            nowplayingMovies: mockMovies,
            loading: false,
            ...overrides,
          }}
        >
          <Nowplaying />
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
    const { container } = renderNowplaying({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('renders movie titles', () => {
    renderNowplaying();
    expect(screen.getByText('Oppenheimer')).toBeInTheDocument();
    expect(screen.getByText('Barbie')).toBeInTheDocument();
  });

  test('renders release dates', () => {
    renderNowplaying();
    // Both movies have same release date
    expect(screen.getAllByText('2023-07-21').length).toBe(2);
  });

  test('renders poster images', () => {
    renderNowplaying();
    const images = document.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster1.jpg');
  });

  test('links to movie detail page', () => {
    renderNowplaying();
    const links = document.querySelectorAll('a[href*="/movie/"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/movie/1/Oppenheimer');
  });

  test('renders SortFilter component', () => {
    renderNowplaying();
    expect(screen.getByText('Popularity (Asc)')).toBeInTheDocument();
    expect(screen.getByText('Filter by Genre')).toBeInTheDocument();
  });

  test('fetches genres and keywords on mount', async () => {
    renderNowplaying();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/genre/'), expect.anything());
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/keyword/'), expect.anything());
    });
  });
});
