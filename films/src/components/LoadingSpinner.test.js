import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    // The visible paragraph shows 'Loading...' (the hidden span also says it, so use getAllByText)
    expect(screen.getAllByText('Loading...').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders with custom text', () => {
    render(<LoadingSpinner text="Fetching movies..." />);
    expect(screen.getAllByText('Fetching movies...').length).toBeGreaterThanOrEqual(1);
  });

  test('renders no text paragraph when text is empty string', () => {
    render(<LoadingSpinner text="" />);
    // The visually-hidden span always says 'Loading...' but the visible <p> should not exist
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  test('renders in fullScreen mode', () => {
    render(<LoadingSpinner fullScreen />);
    const container = screen.getByRole('status').closest('div');
    expect(container.parentElement).toHaveStyle({ minHeight: '100vh' });
  });

  test('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('custom-spinner');
  });
});
