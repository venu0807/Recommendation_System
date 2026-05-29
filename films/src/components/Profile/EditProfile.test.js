import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserContext } from '../Context';
import EditProfile from './EditProfile';

describe('EditProfile', () => {
  const mockUpdateProfile = jest.fn();
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  };
  const defaultPreferences = {
    bio: 'A test bio',
    date_of_birth: '1990-01-15',
    location: 'New York',
    subscription_type: 'premium',
  };

  const renderEditProfile = (overrides = {}) =>
    render(
      <UserContext.Provider
        value={{
          user: defaultUser,
          preferences: defaultPreferences,
          updateProfile: mockUpdateProfile,
          ...overrides,
        }}
      >
        <EditProfile />
      </UserContext.Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders heading', () => {
    renderEditProfile();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  test('pre-fills form fields with user data', () => {
    renderEditProfile();
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test bio')).toBeInTheDocument();
  });

  test('pre-fills optional fields from preferences', () => {
    renderEditProfile();
    expect(screen.getByDisplayValue('1990-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Premium' })).toBeInTheDocument();
  });

  test('handles input change for text fields', () => {
    renderEditProfile();
    const firstNameInput = screen.getByDisplayValue('Test');
    fireEvent.change(firstNameInput, { target: { name: 'first_name', value: 'Updated' } });
    expect(firstNameInput.value).toBe('Updated');
  });

  test('handles input change for select field', () => {
    renderEditProfile();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { name: 'subscription_type', value: 'vip' } });
    expect(select.value).toBe('vip');
  });

  test('calls updateProfile on form submit', () => {
    renderEditProfile();
    fireEvent.click(screen.getByText('Save Changes'));
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      bio: 'A test bio',
      avatar: null,
      date_of_birth: '1990-01-15',
      location: 'New York',
      subscription_type: 'premium',
    });
  });

  test('renders all form labels', () => {
    renderEditProfile();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByText('Avatar')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
  });

  test('renders subscription options', () => {
    renderEditProfile();
    expect(screen.getByRole('option', { name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Premium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'VIP' })).toBeInTheDocument();
  });

  test('renders Save Changes button', () => {
    renderEditProfile();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});
