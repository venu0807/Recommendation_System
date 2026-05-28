import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound', () => {
  const renderNotFound = () =>
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

  test('renders 404 heading', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderNotFound();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Browse Movies')).toBeInTheDocument();
    expect(screen.getByText('Trending Movies')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Movies')).toBeInTheDocument();
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  test('Go Home link points to /', () => {
    renderNotFound();
    expect(screen.getByText('Go Home').closest('a')).toHaveAttribute('href', '/');
  });
});
