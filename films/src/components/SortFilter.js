import React, { useState, useEffect } from 'react';

const SortFilter = ({ onSort, onFilter, genres, keywords }) => {
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');

  const handleSortChange = (sortType) => {
    setSelectedSort(sortType);
    onSort(sortType);
  };

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    onFilter({ genre });
  };

  const handleKeywordChange = (keyword) => {
    setSelectedKeyword(keyword);
    onFilter({ keyword });
  };

  return (
    <div className="sort-filter-container">
      <div className="sort-buttons">
        <button
          className={`sort-button ${selectedSort === 'popularity_asc' ? 'active' : ''}`}
          onClick={() => handleSortChange('popularity_asc')}
        >
          Popularity (Asc)
        </button>
        <button
          className={`sort-button ${selectedSort === 'popularity_desc' ? 'active' : ''}`}
          onClick={() => handleSortChange('popularity_desc')}
        >
          Popularity (Desc)
        </button>
        <button
          className={`sort-button ${selectedSort === 'rating_asc' ? 'active' : ''}`}
          onClick={() => handleSortChange('rating_asc')}
        >
          Rating (Asc)
        </button>
        <button
          className={`sort-button ${selectedSort === 'rating_desc' ? 'active' : ''}`}
          onClick={() => handleSortChange('rating_desc')}
        >
          Rating (Desc)
        </button>
        <button
          className={`sort-button ${selectedSort === 'release_date_asc' ? 'active' : ''}`}
          onClick={() => handleSortChange('release_date_asc')}
        >
          Release Date (Asc)
        </button>
        <button
          className={`sort-button ${selectedSort === 'release_date_desc' ? 'active' : ''}`}
          onClick={() => handleSortChange('release_date_desc')}
        >
          Release Date (Desc)
        </button>
        <button
          className={`sort-button ${selectedSort === 'title_asc' ? 'active' : ''}`}
          onClick={() => handleSortChange('title_asc')}
        >
          Title (A-Z)
        </button>
        <button
          className={`sort-button ${selectedSort === 'title_desc' ? 'active' : ''}`}
          onClick={() => handleSortChange('title_desc')}
        >
          Title (Z-A)
        </button>
      </div>

      <div className="filter-dropdowns">
        <select
          className="filter-select"
          value={selectedGenre}
          onChange={(e) => handleGenreChange(e.target.value)}
        >
          <option value="">Filter by Genre</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.name}>
              {genre.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedKeyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
        >
          <option value="">Filter by Keyword</option>
          {keywords.map((keyword) => (
            <option key={keyword.id} value={keyword.name}>
              {keyword.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SortFilter; 