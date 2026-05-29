import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../Context';
import Profile from './Profile';

describe('Profile', () => {
  const defaultPreferences = {
    autoplayTrailers: true,
    showAdultContent: false,
    language: 'en',
    videoQuality: 'hd',
    preferredGenres: ['Action', 'Comedy'],
    preferredActors: ['Actor A', 'Actor B'],
  };

  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    profile: {
      avatar: '/media/avatars/test.jpg',
      bio: 'A test user bio',
      first_name: 'Test',
      last_name: 'User',
    },
  };

  const renderProfile = (contextOverrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            user: defaultUser,
            preferences: defaultPreferences,
            favorites: [{ id: 1 }],
            watchlist: [{ id: 2 }],
            ...contextOverrides,
          }}
        >
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('shows login prompt when user is not logged in', () => {
    renderProfile({ user: null });
    expect(screen.getByText('Please log in to view your profile.')).toBeInTheDocument();
  });

  test('renders profile heading', () => {
    renderProfile();
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });

  test('renders username and email', () => {
    renderProfile();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('renders full name', () => {
    renderProfile();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  test('renders bio when available', () => {
    renderProfile();
    expect(screen.getByText('A test user bio')).toBeInTheDocument();
  });

  test('renders avatar image when profile has avatar', () => {
    renderProfile();
    const avatarImg = document.querySelector('.profile-avatar');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('alt', 'Avatar');
  });

  test('shows No Avatar placeholder when no avatar', () => {
    renderProfile({
      user: { ...defaultUser, profile: { ...defaultUser.profile, avatar: null } },
    });
    expect(screen.getByText('No Avatar')).toBeInTheDocument();
  });

  test('renders Edit Profile link', () => {
    renderProfile();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  test('renders favorites count badge', () => {
    renderProfile();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  test('renders watchlist count badge', () => {
    renderProfile({ favorites: [], watchlist: [{ id: 1 }, { id: 2 }] });
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
  });

  test('shows zero counts when favorites/watchlist empty', () => {
    renderProfile({ favorites: [], watchlist: [] });
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });

  test('renders preferences section', () => {
    renderProfile();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Autoplay Trailers:')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Show Adult Content:')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Language:')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('Video Quality:')).toBeInTheDocument();
    expect(screen.getByText('hd')).toBeInTheDocument();
  });

  test('renders preferred genres and actors', () => {
    renderProfile();
    expect(screen.getByText('Action, Comedy')).toBeInTheDocument();
    expect(screen.getByText('Actor A, Actor B')).toBeInTheDocument();
  });

  test('shows Not set when no preferred genres', () => {
    renderProfile({
      preferences: { ...defaultPreferences, preferredGenres: [], preferredActors: [] },
    });
    expect(screen.getAllByText('Not set').length).toBe(2);
  });
});
