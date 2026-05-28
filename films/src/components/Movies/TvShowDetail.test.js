import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import TvShowDetail from './TvShowDetail';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
}));

describe('TvShowDetail', () => {
  const mockShow = {
    id: 1,
    name: 'Stranger Things',
    poster_path: '/poster.jpg',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.',
    first_air_date: '2016-07-15',
    genres: [{ id: 1, name: 'Sci-Fi' }, { id: 2, name: 'Horror' }],
    trailer_link: 'https://youtube.com/watch?v=b9EkMc79ZSU',
    number_of_episodes: 34,
    seasons: [
      { id: 1, name: 'Season 1', poster_path: '/season1.jpg', overview: 'The beginning' },
      { id: 2, name: 'Season 2', poster_path: '/season2.jpg', overview: 'The sequel' },
    ],
    cast: [
      {
        id: 101,
        member: 201,
        name: 'Millie Bobby Brown',
        profile_path: '/actor1.jpg',
        job: 'Eleven',
      },
    ],
    crew: [
      {
        id: 102,
        member: 202,
        name: 'The Duffer Brothers',
        job: 'Creator',
      },
    ],
    images: ['/image1.jpg', '/image2.jpg'],
  };

  const defaultContext = {
    user: null,
    authTokens: null,
  };

  const renderTvShowDetail = (overrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ ...defaultContext, ...overrides }}>
          <TvShowDetail />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/tvshow-rating/my_ratings/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/tvshow-favorite/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/tvshow-watchlist/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/tvshow-review/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      // TV show detail
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows loading skeleton', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = renderTvShowDetail();
    expect(container.querySelector('.skeleton-movie-detail')).toBeInTheDocument();
  });

  test('renders TV show name after loading', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Stranger Things')).toBeInTheDocument();
    });
  });

  test('renders overview', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText(/When a young boy vanishes/)).toBeInTheDocument();
    });
  });

  test('renders genres', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
      expect(screen.getByText('Horror')).toBeInTheDocument();
    });
  });

  test('renders first air date', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText(/First Air Date:/)).toBeInTheDocument();
      expect(screen.getByText(/2016-07-15/)).toBeInTheDocument();
    });
  });

  test('renders number of episodes', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText(/Number of Episodes:/)).toBeInTheDocument();
    });
  });

  test('renders seasons section', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Seasons')).toBeInTheDocument();
    });
  });

  test('renders season names', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Season 1')).toBeInTheDocument();
      expect(screen.getByText('Season 2')).toBeInTheDocument();
    });
  });

  test('renders cast section', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Millie Bobby Brown')).toBeInTheDocument();
    });
  });

  test('renders crew section', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('The Duffer Brothers')).toBeInTheDocument();
    });
  });

  test('renders reviews section', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Reviews & Comments')).toBeInTheDocument();
    });
  });

  test('shows no reviews yet when empty', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
    });
  });

  test('renders Watch Trailer button', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Watch Trailer')).toBeInTheDocument();
    });
  });

  test('renders images section', async () => {
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('Images')).toBeInTheDocument();
      const images = document.querySelectorAll('img[alt="Show"]');
      expect(images.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('shows TV show not found when show is null', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ detail: 'Not found.' }),
    });
    renderTvShowDetail();
    await waitFor(() => {
      expect(screen.getByText('TV Show not found')).toBeInTheDocument();
    });
  });

  test('renders rating controls', async () => {
    renderTvShowDetail({ user: { username: 'testuser' }, authTokens: { access: 'token' } });
    await waitFor(() => {
      expect(screen.getByText('Rate this show:')).toBeInTheDocument();
    });
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('renders favorite and watchlist buttons when logged in', async () => {
    renderTvShowDetail({ user: { username: 'testuser' }, authTokens: { access: 'token' } });
    await waitFor(() => {
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
      expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
    });
  });

  test('shows review form when user is logged in', async () => {
    renderTvShowDetail({ user: { username: 'testuser' }, authTokens: { access: 'token' } });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Write a review...')).toBeInTheDocument();
      expect(screen.getByText('Submit Review')).toBeInTheDocument();
    });
  });
});
