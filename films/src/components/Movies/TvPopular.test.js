import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import TvPopular from './TvPopular';

describe('TvPopular', () => {
  const mockShows = [
    { id: 1, name: 'Stranger Things', poster_path: '/poster1.jpg', first_air_date: '2016-07-15' },
    { id: 2, name: 'The Crown', poster_path: '/poster2.jpg', first_air_date: '2016-11-04' },
  ];

  const renderTvPopular = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            tvShowsPopular: mockShows,
            loading: false,
            ...overrides,
          }}
        >
          <TvPopular />
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('shows loading skeleton when loading', () => {
    const { container } = renderTvPopular({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('renders heading', () => {
    renderTvPopular();
    expect(screen.getByText('Popular TV Shows')).toBeInTheDocument();
  });

  test('renders TV show names', () => {
    renderTvPopular();
    expect(screen.getByText('Stranger Things')).toBeInTheDocument();
    expect(screen.getByText('The Crown')).toBeInTheDocument();
  });

  test('renders first air dates', () => {
    renderTvPopular();
    expect(screen.getByText('2016-07-15')).toBeInTheDocument();
    expect(screen.getByText('2016-11-04')).toBeInTheDocument();
  });

  test('renders poster images', () => {
    renderTvPopular();
    const images = document.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/poster1.jpg');
  });

  test('links to TV show detail page', () => {
    renderTvPopular();
    const links = document.querySelectorAll('a[href*="/tv/"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/tv/1/Stranger-Things');
  });
});
