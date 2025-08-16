import React, { useContext, useState } from 'react';
import { UserContext } from '../Context';

const EditProfile = () => {
  const { user, preferences, updateProfile } = useContext(UserContext);
  const [form, setForm] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    bio: preferences?.bio || '',
    avatar: null,
    date_of_birth: preferences?.date_of_birth || '',
    location: preferences?.location || '',
    subscription_type: preferences?.subscription_type || 'free',
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(form);
  };

  return (
    <div className="container mt-4">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>First Name</label>
          <input type="text" name="firstname" value={form.firstname} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Last Name</label>
          <input type="text" name="lastname" value={form.lastname} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Avatar</label>
          <input type="file" name="avatar" onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Date of Birth</label>
          <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Location</label>
          <input type="text" name="location" value={form.location} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label>Subscription Type</label>
          <select name="subscription_type" value={form.subscription_type} onChange={handleChange} className="form-control">
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>
    </div>
  );
};

export default EditProfile;
