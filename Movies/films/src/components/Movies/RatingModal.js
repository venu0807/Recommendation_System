import React, { useState } from 'react';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';

const RatingModal = ({ show, handleClose, handleSubmit, movie }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const ratingLabels = {
    1: 'Terrible',
    2: 'Bad',
    3: 'Okay',
    4: 'Good',
    5: 'Excellent'
  };

  const getRatingIcon = (value) => {
    const props = {
      className: `rating-icon ${(hoveredRating || rating) >= value ? 'active' : ''}`,
      onMouseEnter: () => setHoveredRating(value),
      onMouseLeave: () => setHoveredRating(0),
      onClick: () => setRating(value),
      style: { fontSize: '2rem', cursor: 'pointer' }
    };

    switch (value) {
      case 1:
        return <SentimentVeryDissatisfiedIcon {...props} />;
      case 2:
        return <SentimentDissatisfiedIcon {...props} />;
      case 3:
        return <SentimentNeutralIcon {...props} />;
      case 4:
        return <SentimentSatisfiedIcon {...props} />;
      case 5:
        return <SentimentVerySatisfiedIcon {...props} />;
      default:
        return null;
    }
  };

  const handleRatingSubmit = (e) => {
    e.preventDefault();
    handleSubmit(rating * 2, feedback); // Convert 5-star to 10-point scale
    setRating(0);
    setFeedback('');
    handleClose();
  };

  return (
    <div className={`modal fade ${show ? 'show' : ''}`} 
         style={{ display: show ? 'block' : 'none' }}
         tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rating-modal">
          <div className="modal-header">
            <h5 className="modal-title">Rate "{movie?.title}"</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleRatingSubmit}>
              <div className="rating-container">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="rating-item">
                    {getRatingIcon(value)}
                    <span className="rating-label">
                      {ratingLabels[value]}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mb-3 mt-4">
                <label htmlFor="feedback" className="form-label">
                  Share your thoughts (optional)
                </label>
                <textarea
                  className="form-control"
                  id="feedback"
                  rows="3"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What did you think about the movie?"
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!rating}
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal; 