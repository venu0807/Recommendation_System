import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserContext } from './Context';
import Notifications from './Notifications';

describe('Notifications', () => {
  const renderWithNotifications = (notifications) =>
    render(
      <UserContext.Provider value={{ notifications }}>
        <Notifications />
      </UserContext.Provider>
    );

  test('renders nothing when notifications are empty', () => {
    const { container } = renderWithNotifications([]);
    expect(container.querySelector('.notifications-container')).toBeInTheDocument();
    expect(container.querySelectorAll('.notification')).toHaveLength(0);
  });

  test('renders all notifications', () => {
    const notifications = [
      { id: 1, message: 'Profile updated', type: 'success' },
      { id: 2, message: 'Movie added to favorites', type: 'info' },
    ];
    renderWithNotifications(notifications);
    expect(screen.getByText('Profile updated')).toBeInTheDocument();
    expect(screen.getByText('Movie added to favorites')).toBeInTheDocument();
  });

  test('applies notification type as CSS class', () => {
    const notifications = [
      { id: 1, message: 'Error occurred', type: 'error' },
    ];
    renderWithNotifications(notifications);
    const notificationEl = screen.getByText('Error occurred');
    expect(notificationEl.className).toContain('error');
  });
});
