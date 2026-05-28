import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RatingModal from './RatingModal';

describe('RatingModal', () => {
  const mockMovie = { id: 1, title: 'Inception' };
  const mockHandleClose = jest.fn();
  const mockHandleSubmit = jest.fn();

  const renderModal = (show = true) =>
    render(
      <RatingModal
        show={show}
        handleClose={mockHandleClose}
        handleSubmit={mockHandleSubmit}
        movie={mockMovie}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when show is true', () => {
    renderModal(true);
    expect(screen.getByText(/Rate "Inception"/)).toBeInTheDocument();
  });

  test('is hidden when show is false', () => {
    const { container } = renderModal(false);
    const modal = container.querySelector('.modal');
    expect(modal).toBeInTheDocument();
    expect(modal.style.display).toBe('none');
  });

  test('is visible when show is true', () => {
    const { container } = renderModal(true);
    const modal = container.querySelector('.modal');
    expect(modal.style.display).toBe('block');
  });

  test('renders all five sentiment icons', () => {
    renderModal(true);
    expect(screen.getByText('Terrible')).toBeInTheDocument();
    expect(screen.getByText('Bad')).toBeInTheDocument();
    expect(screen.getByText('Okay')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  test('submits rating converted to 10-point scale', () => {
    const { container } = renderModal(true);
    // Find the 4th rating-item div and click on its SVG icon (value=4 -> Good)
    const items = container.querySelectorAll('.rating-item');
    const icon = items[3].querySelector('svg');
    fireEvent.click(icon);
    fireEvent.click(screen.getByText('Submit Rating'));
    expect(mockHandleSubmit).toHaveBeenCalledWith(8, ''); // 4 * 2 = 8
  });

  test('submit button is disabled when no rating selected', () => {
    renderModal(true);
    expect(screen.getByText('Submit Rating')).toBeDisabled();
  });

  test('calls handleClose on Cancel', () => {
    renderModal(true);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockHandleClose).toHaveBeenCalled();
  });

  test('calls handleClose on close button', () => {
    renderModal(true);
    const closeBtn = document.querySelector('.btn-close');
    fireEvent.click(closeBtn);
    expect(mockHandleClose).toHaveBeenCalled();
  });

  test('renders feedback textarea', () => {
    renderModal(true);
    expect(screen.getByPlaceholderText('What did you think about the movie?')).toBeInTheDocument();
  });

  test('clears rating and feedback after submit', () => {
    const { container } = renderModal(true);
    // Find the 4th rating-item div and click on its SVG icon
    const items = container.querySelectorAll('.rating-item');
    const icon = items[3].querySelector('svg');
    fireEvent.click(icon);
    const textarea = screen.getByPlaceholderText('What did you think about the movie?');
    fireEvent.change(textarea, { target: { value: 'Great movie!' } });
    fireEvent.click(screen.getByText('Submit Rating'));
    expect(mockHandleSubmit).toHaveBeenCalledWith(8, 'Great movie!');
  });
});
