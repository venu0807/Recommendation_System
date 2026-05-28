import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import TvTopRated from './TvTopRated';

describe('TvTopRated', () => {
  const mockShows = [
    { id: 1, name: 'Breaking Bad', poster_path: '/poster1.jpg', first_air_date: '2008-01-20' },
    { id: 2, name: 'The Wire', poster_path: '/poster2.jpg', first_air_date: '2002-06-02' },
  ];

  const renderTvTopRated = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            tvShowsTopRated: mockShows,
            loading: false,
            ...overrides,
          }}
        >
          <TvTopRated />
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('shows loading skeleton when loading', () => {
    const { container } = renderTvTopRated({ loading: true });
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('renders heading', () => {
    renderTvTopRated();
    expect(screen.getByText('Top Rated TV Shows')).toBeInTheDocument();
  });

  test('renders TV show names', () => {
    renderTvTopRated();
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('The Wire')).toBeInTheDocument();
  });

  test('renders first air dates', () => {
    renderTvTopRated();
    expect(screen.getByText('2008-01-20')).toBeInTheDocument();
  });

  test('links to TV show detail page', () => {
    renderTvTopRated();
    const links = document.querySelectorAll('a[href*="/tv/"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/tv/1/Breaking-Bad');
  });
});
