import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UserContext } from './Context';
import PrivateRoute from './PrivateRoute';

describe('PrivateRoute', () => {
  const ProtectedPage = () => <div data-testid="protected">Protected Content</div>;
  const LoginPage = () => <div data-testid="login-page">Login Page</div>;

  const renderWithContext = (userValue) =>
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <UserContext.Provider value={userValue}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <ProtectedPage />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </UserContext.Provider>
      </MemoryRouter>
    );

  test('renders children when user is authenticated', () => {
    renderWithContext({ user: { username: 'testuser' } });
    expect(screen.getByTestId('protected')).toHaveTextContent('Protected Content');
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  test('redirects to /login when user is not authenticated', () => {
    renderWithContext({ user: null });
    expect(screen.getByTestId('login-page')).toHaveTextContent('Login Page');
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });
});
