import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import PersonComponent from './Person';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useLocation: () => ({ state: null }),
}));

describe('PersonComponent', () => {
  const mockCast = [
    {
      id: 101,
      member: 201,
      name: 'Leonardo DiCaprio',
      profile_path: '/actor1.jpg',
      character: 'Dom Cobb',
    },
  ];

  const mockCrew = [
    {
      id: 102,
      member: 202,
      name: 'Christopher Nolan',
      profile_path: '/crew1.jpg',
      job: 'Director',
    },
  ];

  const mockMovie = {
    id: 1,
    title: 'Inception',
    cast: mockCast,
    crew: mockCrew,
  };

  const renderPerson = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            movies: [],
            upcomingMovies: [],
            nowplayingMovies: [],
            trendingMovies: [],
            topratedMovies: [],
            loading: false,
            ...overrides,
          }}
        >
          <PersonComponent />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMovie),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetches movie from API when not in context', async () => {
    renderPerson();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/movie/1/'));
    });
  });

  test('renders cast section', async () => {
    renderPerson();
    await waitFor(() => {
      expect(screen.getByText('Leonardo DiCaprio')).toBeInTheDocument();
    });
    expect(screen.getByText('Dom Cobb')).toBeInTheDocument();
  });

  test('renders crew section', async () => {
    renderPerson();
    await waitFor(() => {
      expect(screen.getByText('Christopher Nolan')).toBeInTheDocument();
    });
    expect(screen.getByText('Director')).toBeInTheDocument();
  });

  test('renders cast and crew headings', async () => {
    renderPerson();
    await waitFor(() => {
      expect(screen.getByText('Cast')).toBeInTheDocument();
      expect(screen.getByText('Crew')).toBeInTheDocument();
    });
  });

  test('shows empty state when no cast', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, title: 'Movie', cast: [], crew: [] }),
    });
    renderPerson();
    await waitFor(() => {
      expect(screen.getByText('No cast information available.')).toBeInTheDocument();
      expect(screen.getByText('No crew information available.')).toBeInTheDocument();
    });
  });

  test('links to person detail pages', async () => {
    renderPerson();
    await waitFor(() => {
      const links = document.querySelectorAll('a[href*="/person/"]');
      expect(links.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('finds movie from context when available', async () => {
    renderPerson({
      movies: [mockMovie],
      loading: false,
    });
    await waitFor(() => {
      expect(screen.getByText('Leonardo DiCaprio')).toBeInTheDocument();
    });
    // Should NOT have fetched from API since movie is in context
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/movie/1/'));
  });
});
