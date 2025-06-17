import React, { useContext } from 'react';
import { UserContext } from './Context';

const Notifications = () => {
  const { notifications } = useContext(UserContext);

  return (
    <div className="notifications-wrapper">
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;