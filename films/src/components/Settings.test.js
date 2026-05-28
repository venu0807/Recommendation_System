import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './Context';
import Settings from './Settings';

describe('Settings', () => {
  const mockUpdatePreferences = jest.fn();
  const defaultContext = {
    preferences: {
      autoplayTrailers: true,
      showAdultContent: false,
      language: 'en',
      videoQuality: 'hd',
      preferredGenres: [],
      preferredActors: [],
      notInterestedMovies: [],
    },
    updatePreferences: mockUpdatePreferences,
  };

  const renderSettings = (contextOverrides = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ ...defaultContext, ...contextOverrides }}>
          <Settings />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'Action' },
        { id: 2, name: 'Comedy' },
      ]),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders settings heading', () => {
    renderSettings();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders all preference controls', () => {
    renderSettings();
    expect(screen.getByText('Autoplay Trailers')).toBeInTheDocument();
    expect(screen.getByText('Show Adult Content')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Video Quality')).toBeInTheDocument();
    expect(screen.getByText('Preferred Genres')).toBeInTheDocument();
    expect(screen.getByText('Preferred Actors')).toBeInTheDocument();
    expect(screen.getByText('Save Preferences')).toBeInTheDocument();
  });

  test('fetches genres and actors on mount', async () => {
    renderSettings();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/genre/'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/person/'));
    });
  });

  test('calls updatePreferences on save', () => {
    renderSettings();
    fireEvent.click(screen.getByText('Save Preferences'));
    expect(mockUpdatePreferences).toHaveBeenCalled();
  });

  test('toggle autoplayTrailers checkbox', () => {
    renderSettings();
    const checkbox = screen.getByLabelText('Autoplay Trailers');
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  test('renders language options', () => {
    renderSettings();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
  });

  test('renders video quality options', () => {
    renderSettings();
    expect(screen.getByText('SD')).toBeInTheDocument();
    expect(screen.getByText('HD')).toBeInTheDocument();
    expect(screen.getByText('4K')).toBeInTheDocument();
  });
});
