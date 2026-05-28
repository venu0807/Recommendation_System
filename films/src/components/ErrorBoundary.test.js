import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Silence expected console errors from ErrorBoundary tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const GoodComponent = () => <div data-testid="good-child">Working</div>;

const BadComponent = () => {
  throw new Error('Test error message');
};

describe('ErrorBoundary', () => {
  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('good-child')).toHaveTextContent('Working');
  });

  test('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  test('reload button calls window.location.reload', () => {
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));
    expect(reloadMock).toHaveBeenCalled();
  });
});
