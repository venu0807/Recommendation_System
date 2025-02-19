import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from './Context';

const Settings = () => {
  const { preferences, updatePreferences } = useContext(UserContext);
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [genres, setGenres] = useState([]);
  const [actors, setActors] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      const response = await fetch('http://localhost:8000/genre/');
      const data = await response.json();
      setGenres(data);
    };
    const fetchActors = async () => {
      const response = await fetch('http://localhost:8000/person/');
      const data = await response.json();
      setActors(data);
    };
    fetchGenres();
    fetchActors();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalPrefs(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    setLocalPrefs(prev => ({
      ...prev,
      [name]: selectedValues
    }));
  };

  const handleSave = () => {
    updatePreferences(localPrefs);
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="autoplayTrailers"
            checked={localPrefs.autoplayTrailers}
            onChange={handleChange}
          />
          Autoplay Trailers
        </label>
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="showAdultContent"
            checked={localPrefs.showAdultContent}
            onChange={handleChange}
          />
          Show Adult Content
        </label>
      </div>
      <div className="form-group">
        <label>Language</label>
        <select
          name="language"
          value={localPrefs.language}
          onChange={handleChange}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
      <div className="form-group">
        <label>Video Quality</label>
        <select
          name="videoQuality"
          value={localPrefs.videoQuality}
          onChange={handleChange}
        >
          <option value="sd">SD</option>
          <option value="hd">HD</option>
          <option value="4k">4K</option>
        </select>
      </div>
      <div className="form-group">
        <label>Preferred Genres</label>
        <select
          name="preferredGenres"
          multiple
          value={localPrefs.preferredGenres}
          onChange={handleMultiSelectChange}
        >
          {genres.map(genre => (
            <option key={genre.id} value={genre.id}>{genre.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Preferred Actors</label>
        <select
          name="preferredActors"
          multiple
          value={localPrefs.preferredActors}
          onChange={handleMultiSelectChange}
        >
          {actors.map(actor => (
            <option key={actor.id} value={actor.id}>{actor.name}</option>
          ))}
        </select>
      </div>
      <button onClick={handleSave}>Save Preferences</button>
    </div>
  );
};

export default Settings; 