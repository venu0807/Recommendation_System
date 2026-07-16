import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, UserContext } from './Context';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({ user_id: 1, username: 'testuser' })),
}));

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onopen = jest.fn();
    this.onclose = jest.fn();
    this.onerror = jest.fn();
    this.onmessage = jest.fn();
  }
  close = jest.fn();
}
global.WebSocket = MockWebSocket;

// Helper component to consume context in tests
const TestConsumer = () => {
  const context = useContext(UserContext);
  return (
    <div>
      <div data-testid="loading-status">{context.loading ? 'loading' : 'ready'}</div>
      <div data-testid="movies-count">{context.movies?.length || 0}</div>
      <div data-testid="user-status">{context.user ? 'logged_in' : 'logged_out'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => context.loginUser({ preventDefault: jest.fn(), target: { username: { value: 'user' }, password: { value: 'pass' } } })}
      >
        Login
      </button>
      <button 
        data-testid="add-fav-btn" 
        onClick={() => context.addToFavorites(1)}
      >
        Add Fav
      </button>
    </div>
  );
};

describe('UserProvider Context Regression Suite', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes and fetches boot data correctly', async () => {
    // Mock successful fetch responses for movies and TV shows
    global.fetch.mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ id: 1, title: 'Test Movie' }])
      });
    });

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    // Should start in loading state showing the spinner, not the TestConsumer
    expect(screen.getByText('Loading movies...')).toBeInTheDocument();

    // Wait for the context to finish loading (TestConsumer is now rendered)
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    }, { timeout: 3000 });

    // Should have populated movies
    expect(screen.getByTestId('movies-count')).toHaveTextContent('1');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/movie/popular/'));
  });

  test('login flow correctly sets authTokens and user', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/token/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ access: 'fake-access-token', refresh: 'fake-refresh-token' })
        });
      }
      if (url.includes('/api/user/me/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 1, bio: 'Hello' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    // Currently logged out
    expect(screen.getByTestId('user-status')).toHaveTextContent('logged_out');

    // Trigger login
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    // Should update user state
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged_in');
    });

    // Check if token endpoint was hit
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/token/'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  test('addToFavorites fails safely if user is not logged in', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    // Trigger add to favorites while logged out
    await act(async () => {
      screen.getByTestId('add-fav-btn').click();
    });

    // Should NOT have made a POST request to add favorites
    const favFetchCall = global.fetch.mock.calls.find(call => call[0].includes('/favorites/add/'));
    expect(favFetchCall).toBeUndefined();
    // It should redirect to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
