import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchResults from './Search';

describe('SearchResults', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderSearch = (query = '') => {
    const url = query ? `/?query=${query}` : '/';
    return render(
      <MemoryRouter initialEntries={[url]}>
        <SearchResults />
      </MemoryRouter>
    );
  };

  test('does not fetch results without a query param', () => {
    renderSearch();
    // The heading renders with empty query, but fetch should not be called
    expect(screen.getByText(/Search Results for/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('shows loading skeleton state initially', () => {
    // Never resolve the fetch
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = renderSearch('test');
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
  });

  test('renders search results heading with query', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ movies: [], persons: [] }),
    });

    renderSearch('inception');
    await waitFor(() => {
      expect(screen.getByText(/"inception"/)).toBeInTheDocument();
    });
  });

  test('renders empty state when no results', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ movies: [], persons: [] }),
    });

    renderSearch('nonexistent');
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  test('renders movie results', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        movies: [
          { id: 1, title: 'Test Movie', poster_path: '/test.jpg', popularity: 80 },
        ],
        persons: [],
      }),
    });

    renderSearch('test');
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
      expect(screen.getByText('1 results')).toBeInTheDocument();
    });
  });

  test('renders error state on fetch failure', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    renderSearch('test');
    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  test('renders category filter buttons', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ movies: [], persons: [] }),
    });

    renderSearch('test');
    await waitFor(() => {
      expect(screen.getByText('Movies')).toBeInTheDocument();
      expect(screen.getByText('Persons')).toBeInTheDocument();
    });
  });

  test('switches between movies and persons categories', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ movies: [], persons: [] }),
    });

    renderSearch('test');
    await waitFor(() => {
      expect(screen.getByText('Movies')).toBeInTheDocument();
    });
  });
});
