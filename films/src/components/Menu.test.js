import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './Context';
import Menu from './Menu';

describe('Menu', () => {
  const mockLogoutUser = jest.fn();

  const renderMenu = (contextOverrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{ user: null, logoutUser: mockLogoutUser, ...contextOverrides }}
        >
          <Menu />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders brand name', () => {
    renderMenu();
    expect(screen.getByText('FilmFinder')).toBeInTheDocument();
  });

  test('shows Login button when user is not authenticated', () => {
    renderMenu();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('shows user avatar and logout when user is authenticated', () => {
    renderMenu({ user: { username: 'John' } });
    expect(screen.getByText('J')).toBeInTheDocument(); // First letter of username
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderMenu();
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  test('renders search input', () => {
    renderMenu();
    expect(screen.getByPlaceholderText('Search movies...')).toBeInTheDocument();
  });

  test('logout button calls logoutUser', () => {
    renderMenu({ user: { username: 'John' } });
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogoutUser).toHaveBeenCalled();
  });

  test('renders authenticated dropdown items', () => {
    renderMenu({ user: { username: 'John' } });
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });
});
