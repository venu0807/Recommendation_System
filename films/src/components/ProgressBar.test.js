import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  beforeEach(() => {
    // Mock window properties
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
  });

  const renderProgressBar = () =>
    render(
      <MemoryRouter>
        <ProgressBar />
      </MemoryRouter>
    );

  test('renders progress bar with 0% width initially', () => {
    const { container } = renderProgressBar();
    const bar = container.querySelector('.progress-bar');
    expect(bar).toBeInTheDocument();
    expect(bar.style.width).toBe('0%');
  });

  test('updates width on scroll', () => {
    const { container } = renderProgressBar();

    // Scroll halfway: (500 / (2000 - 1000)) * 100 = 50%
    window.pageYOffset = 500;
    fireEvent.scroll(window);

    const bar = container.querySelector('.progress-bar');
    expect(bar.style.width).toBe('50%');
  });

  test('removes event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderProgressBar();
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
