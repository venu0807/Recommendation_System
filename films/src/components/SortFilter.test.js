import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SortFilter from './SortFilter';

describe('SortFilter', () => {
  const mockOnSort = jest.fn();
  const mockOnFilter = jest.fn();
  const genres = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Comedy' },
  ];
  const keywords = [
    { id: 1, name: 'thriller' },
    { id: 2, name: 'adventure' },
  ];

  const renderSortFilter = () =>
    render(
      <SortFilter
        onSort={mockOnSort}
        onFilter={mockOnFilter}
        genres={genres}
        keywords={keywords}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sort buttons', () => {
    renderSortFilter();
    expect(screen.getByText('Popularity (Asc)')).toBeInTheDocument();
    expect(screen.getByText('Popularity (Desc)')).toBeInTheDocument();
    expect(screen.getByText('Rating (Asc)')).toBeInTheDocument();
    expect(screen.getByText('Rating (Desc)')).toBeInTheDocument();
    expect(screen.getByText('Release Date (Asc)')).toBeInTheDocument();
    expect(screen.getByText('Release Date (Desc)')).toBeInTheDocument();
    expect(screen.getByText('Title (A-Z)')).toBeInTheDocument();
    expect(screen.getByText('Title (Z-A)')).toBeInTheDocument();
  });

  test('calls onSort when a sort button is clicked', () => {
    renderSortFilter();
    fireEvent.click(screen.getByText('Popularity (Asc)'));
    expect(mockOnSort).toHaveBeenCalledWith('popularity_asc');
  });

  test('applies active class to selected sort button', () => {
    renderSortFilter();
    const button = screen.getByText('Popularity (Asc)');
    fireEvent.click(button);
    expect(button.className).toContain('active');
  });

  test('renders genre and keyword filter dropdowns', () => {
    renderSortFilter();
    expect(screen.getByText('Filter by Genre')).toBeInTheDocument();
    expect(screen.getByText('Filter by Keyword')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Comedy')).toBeInTheDocument();
    expect(screen.getByText('thriller')).toBeInTheDocument();
    expect(screen.getByText('adventure')).toBeInTheDocument();
  });

  test('calls onFilter when genre is selected', () => {
    renderSortFilter();
    const genreSelect = screen.getByText('Filter by Genre').closest('select');
    fireEvent.change(genreSelect, { target: { value: 'Action' } });
    expect(mockOnFilter).toHaveBeenCalledWith({ genre: 'Action' });
  });

  test('calls onFilter when keyword is selected', () => {
    renderSortFilter();
    const keywordSelect = screen.getByText('Filter by Keyword').closest('select');
    fireEvent.change(keywordSelect, { target: { value: 'thriller' } });
    expect(mockOnFilter).toHaveBeenCalledWith({ keyword: 'thriller' });
  });
});
