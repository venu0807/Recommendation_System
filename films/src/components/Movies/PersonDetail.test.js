import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PersonDetail from './PersonDetail';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '201' }),
}));

describe('PersonDetail', () => {
  const mockPerson = {
    id: 201,
    name: 'Leonardo DiCaprio',
    profile_path: '/actor.jpg',
    known_for_department: 'Acting',
    birthday: '1974-11-11',
    place_of_birth: 'Los Angeles, California, USA',
    biography: 'An American actor known for his work in biographical and period films.',
  };

  const mockMovies = [
    { id: 1, title: 'Inception', release_date: '2010-07-16', popularity: 80, role_type: 'cast', role: 'Dom Cobb' },
    { id: 2, title: 'The Revenant', release_date: '2015-12-25', popularity: 70, role_type: 'cast', role: 'Hugh Glass' },
    { id: 3, title: 'The Wolf of Wall Street', release_date: '2013-12-25', popularity: 75, role_type: 'cast', role: 'Jordan Belfort' },
    { id: 5, title: 'Shutter Island', release_date: '2010-02-19', popularity: 65, role_type: 'cast', role: 'Teddy Daniels' },
  ];

  const renderPersonDetail = () =>
    render(
      <MemoryRouter>
        <PersonDetail />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/person/201/movies/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMovies),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPerson),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows loading skeleton', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = renderPersonDetail();
    expect(container.querySelector('.skeleton-person-card')).toBeInTheDocument();
  });

  test('renders person name after loading', async () => {
    renderPersonDetail();
    await waitFor(() => {
      expect(screen.getByText('Leonardo DiCaprio')).toBeInTheDocument();
    });
  });

  test('renders personal info', async () => {
    renderPersonDetail();
    await waitFor(() => {
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
      expect(screen.getByText('Known For')).toBeInTheDocument();
      expect(screen.getByText('Acting')).toBeInTheDocument();
      expect(screen.getByText('Birthday')).toBeInTheDocument();
      expect(screen.getByText('1974-11-11')).toBeInTheDocument();
      expect(screen.getByText('Place of Birth')).toBeInTheDocument();
    });
  });

  test('renders biography', async () => {
    renderPersonDetail();
    await waitFor(() => {
      expect(screen.getByText('Biography')).toBeInTheDocument();
      expect(screen.getByText(/An American actor/)).toBeInTheDocument();
    });
  });

  test('renders popular movies section', async () => {
    renderPersonDetail();
    await waitFor(() => {
      const headings = screen.getAllByText('Popular Movies');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('renders filmography table', async () => {
    renderPersonDetail();
    await waitFor(() => {
      expect(screen.getByText(/Complete Filmography/)).toBeInTheDocument();
      expect(screen.getByText(/4 titles/)).toBeInTheDocument();
    });
    expect(screen.getAllByText('Inception').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('The Revenant').length).toBeGreaterThanOrEqual(1);
  });

  test('renders table headers', async () => {
    renderPersonDetail();
    await waitFor(() => {
      expect(screen.getByText('Year')).toBeInTheDocument();
      expect(screen.getByText('Movie')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
  });

  test('shows role for cast members', async () => {
    renderPersonDetail();
    await waitFor(() => {
      expect(screen.getByText('Actor (Dom Cobb)')).toBeInTheDocument();
    });
  });

  test('shows error state', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Person not found'));
    renderPersonDetail();
    await waitFor(() => {
      expect(screen.getByText('Error: Person not found')).toBeInTheDocument();
    });
  });
});
