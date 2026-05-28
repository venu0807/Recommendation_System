import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import TvOnAir from './TvOnAir';

describe('TvOnAir', () => {
  const mockShows = [
    { id: 1, name: 'House of the Dragon', poster_path: '/poster1.jpg', first_air_date: '2022-08-21' },
    { id: 2, name: 'The Last of Us', poster_path: '/poster2.jpg', first_air_date: '2023-01-15' },
  ];

  const renderTvOnAir = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            tvShowsOnAir: mockShows,
            loading: false,
            ...overrides,
          }}
        >
          <TvOnAir />
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('shows loading skeleton when loading', () => {
    const { container } = renderTvOnAir({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('renders heading', () => {
    renderTvOnAir();
    expect(screen.getByText('On Air TV Shows')).toBeInTheDocument();
  });

  test('renders TV show names', () => {
    renderTvOnAir();
    expect(screen.getByText('House of the Dragon')).toBeInTheDocument();
    expect(screen.getByText('The Last of Us')).toBeInTheDocument();
  });

  test('renders first air dates', () => {
    renderTvOnAir();
    expect(screen.getByText('2022-08-21')).toBeInTheDocument();
    expect(screen.getByText('2023-01-15')).toBeInTheDocument();
  });

  test('links to TV show detail page', () => {
    renderTvOnAir();
    const links = document.querySelectorAll('a[href*="/tv/"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/tv/1/House-of-the-Dragon');
  });
});
