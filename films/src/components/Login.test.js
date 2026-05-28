import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './Context';
import Login from './Login';

describe('Login', () => {
  const mockLoginUser = jest.fn();

  const renderLogin = (contextValue = {}) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ loginUser: mockLoginUser, ...contextValue }}>
          <Login />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with username and password fields', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('submits form with loginUser from context', () => {
    renderLogin();
    const form = screen.getByRole('button', { name: 'Sign In' }).closest('form');
    fireEvent.submit(form);
    expect(mockLoginUser).toHaveBeenCalled();
  });

  test('renders forgot password and create account links', () => {
    renderLogin();
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  test('flips card when Forgot Password is clicked', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Forgot Password?'));
    // 'Reset Password' appears in both <h2> and <button> - check at least one is present
    expect(screen.getAllByText('Reset Password').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  test('flips back when Back to Login is clicked', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Forgot Password?'));
    expect(screen.getAllByText('Reset Password').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText('Back to Login'));
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
  });
});
