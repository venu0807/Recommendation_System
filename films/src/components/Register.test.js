import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './Context';
import Register from './Register';

describe('Register', () => {
  const mockRegisterUser = jest.fn();

  const renderRegister = () =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={{ registerUser: mockRegisterUser }}>
          <Register />
        </UserContext.Provider>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders step 1 with username and email fields', () => {
    renderRegister();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  test('progresses to step 2 on Next', () => {
    renderRegister();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  test('progresses to step 3 on Next from step 2', () => {
    renderRegister();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    // Bootstrap floating labels don't use htmlFor/id, so query by placeholder
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    // 'Create Account' appears in both h2 heading and submit button
    const createAccountElements = screen.getAllByText('Create Account');
    expect(createAccountElements.length).toBeGreaterThanOrEqual(1);
  });

  test('goes back to step 2 from step 3', () => {
    renderRegister();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
  });

  test('submits form with registerUser from context on step 3', () => {
    renderRegister();
    // Fill step 1
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { name: 'username', value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'user@test.com' } });
    fireEvent.click(screen.getByText('Next'));
    // Fill step 2
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { name: 'firstname', value: 'New' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { name: 'lastname', value: 'User' } });
    fireEvent.click(screen.getByText('Next'));
    // Step 3 - submit (query by placeholder since floating labels lack htmlFor/id)
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { name: 'password', value: 'pass123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { name: 'confirmPassword', value: 'pass123' } });
    // Click the submit button specifically
    const submitButton = screen.getAllByText('Create Account')[1];
    fireEvent.click(submitButton);
    expect(mockRegisterUser).toHaveBeenCalled();
  });

  test('renders sign in link', () => {
    renderRegister();
    expect(screen.getByText('Already have an account? Sign In')).toBeInTheDocument();
  });
});
