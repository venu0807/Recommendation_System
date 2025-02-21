import React, { useContext } from 'react';
import { UserContext } from '../Context';

const Profile = () => {
  const { user, preferences } = useContext(UserContext);

  if (!user) {
    return <div className="profile-page">Please log in to view your profile.</div>;
  }

  return (
    <div className="container-fluid mt-5 profile-page">
      <h2 className="profile-heading">User Profile</h2>
      <div className="profile-details">
        <p><strong>Username:</strong> <span className="profile-value">{user.username}</span></p>
        <p><strong>Email:</strong> <span className="profile-value">{user.email}</span></p>
        <p><strong>Full Name:</strong> <span className="profile-value">{user.firstname} {user.lastname}</span></p>
      </div>
      <div className="preferences-details">
        <h3 className="preferences-heading">Preferences</h3>
        <p><strong>Autoplay Trailers:</strong> <span className="profile-value">{preferences.autoplayTrailers ? 'Yes' : 'No'}</span></p>
        <p><strong>Show Adult Content:</strong> <span className="profile-value">{preferences.showAdultContent ? 'Yes' : 'No'}</span></p>
        <p><strong>Language:</strong> <span className="profile-value">{preferences.language}</span></p>
        <p><strong>Video Quality:</strong> <span className="profile-value">{preferences.videoQuality}</span></p>
        <p><strong>Preferred Genres:</strong> <span className="profile-value">{preferences.preferredGenres.join(', ') || 'Not set'}</span></p>
        <p><strong>Preferred Actors:</strong> <span className="profile-value">{preferences.preferredActors.join(', ') || 'Not set'}</span></p>
      </div>
    </div>
  );
};

export default Profile;