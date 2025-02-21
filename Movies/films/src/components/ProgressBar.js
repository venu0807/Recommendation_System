import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const total = docHeight - windowHeight;
      setProgress((scrollTop / total) * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  return (
    <div 
      className="progress-bar" 
      style={{ width: `${progress}%` }}
    ></div>
  );
};

export default ProgressBar; 