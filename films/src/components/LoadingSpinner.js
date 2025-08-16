import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'spinner-border-sm',
    medium: '',
    large: 'spinner-border-lg'
  };

  const spinnerClass = `spinner-border text-primary ${sizeClasses[size]} ${className}`;

  if (fullScreen) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className={spinnerClass} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        {text && <p className="mt-3 text-muted">{text}</p>}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div className={spinnerClass} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && <p className="mt-2 text-muted mb-0">{text}</p>}
    </div>
  );
};

export default LoadingSpinner; 