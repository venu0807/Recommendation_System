import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './Context';
import Footer from './Footer';

describe('Footer', () => {
  const renderFooter = () =>
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

  test('renders company name', () => {
    renderFooter();
    expect(screen.getByText('Movie Recommender')).toBeInTheDocument();
  });

  test('renders current year in copyright', () => {
    renderFooter();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
  });

  test('renders navigation links for Movies', () => {
    renderFooter();
    // 'Popular' appears in both Movies and TV Shows columns
    const popularLinks = screen.getAllByText('Popular');
    expect(popularLinks.length).toBeGreaterThanOrEqual(1);
    // 'Top Rated' appears in both Movies and TV Shows columns
    const topRatedLinks = screen.getAllByText('Top Rated');
    expect(topRatedLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Nowplaying')).toBeInTheDocument();
  });

  test('renders navigation links for TV Shows', () => {
    renderFooter();
    expect(screen.getByText('All Shows')).toBeInTheDocument();
    expect(screen.getByText('On Air')).toBeInTheDocument();
  });

  test('renders Account links', () => {
    renderFooter();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
