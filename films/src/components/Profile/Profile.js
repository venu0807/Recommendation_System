import React, { useContext } from 'react';
import { UserContext } from '../Context';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../../config';

const Profile = () => {
  const { user, preferences, favorites, watchlist } = useContext(UserContext);

  if (!user) {
    return <div className="profile-page">Please log in to view your profile.</div>;
  }

  // Use extended profile info if available
  const profile = user.profile || {};
  const avatarUrl = profile.avatar
    ? (profile.avatar.startsWith('http') ? profile.avatar : `${API_BASE_URL}${profile.avatar}`)
    : null;

  return (
    <div className="container-fluid mt-5 profile-page">
      <h2 className="profile-heading">User Profile</h2>
      <div className="profile-details row align-items-center">
        <div className="col-md-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="profile-avatar img-thumbnail" style={{ width: 120, height: 120, objectFit: 'cover' }} />
          ) : (
            <div className="profile-avatar-placeholder">No Avatar</div>
          )}
        </div>
        <div className="col-md-10">
          <p><strong>Username:</strong> <span className="profile-value">{user.username}</span></p>
          <p><strong>Email:</strong> <span className="profile-value">{user.email}</span></p>
          <p><strong>Full Name:</strong> <span className="profile-value">{profile.first_name || user.first_name} {profile.last_name || user.last_name}</span></p>
          {profile.bio && <p><strong>Bio:</strong> <span className="profile-value">{profile.bio}</span></p>}
          <Link to="/profile/edit" className="btn btn-outline-primary btn-sm mt-2">Edit Profile</Link>
        </div>
      </div>
      <div className="profile-stats row mt-4">
        <div className="col-md-3">
          <Link to="/profile/favorites" className="btn btn-link">
            Favorites <span className="badge bg-primary">{favorites?.length || 0}</span>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/profile/watchlist" className="btn btn-link">
            Watchlist <span className="badge bg-success">{watchlist?.length || 0}</span>
          </Link>
        </div>
      </div>
      <div className="preferences-details mt-4">
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
