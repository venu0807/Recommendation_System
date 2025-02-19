import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from './Context';

const Login = () => {
  const { loginUser } = useContext(UserContext);
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="auth-container">
      <div className={`auth-card ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="auth-card-inner">
          <div className="auth-card-front">
            <h2 className="auth-title">Welcome Back!</h2>
            <p className="auth-subtitle">Sign in to continue your movie journey</p>
            
            <form onSubmit={loginUser} className="auth-form">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  placeholder="Username"
                  required
                />
                <label htmlFor="username">Username</label>
              </div>

              <div className="form-floating mb-4">
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  placeholder="Password"
                  required
                />
                <label htmlFor="password">Password</label>
              </div>

              <button type="submit" className="btn btn-primary auth-button">
                Sign In
              </button>
            </form>

            <div className="auth-links">
              <button 
                className="btn btn-link"
                onClick={() => setIsFlipped(true)}
              >
                Forgot Password?
              </button>
              <Link to="/register" className="btn btn-link">
                Create Account
              </Link>
            </div>
          </div>

          <div className="auth-card-back">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">Enter your email to reset your password</p>
            
            <form className="auth-form">
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="reset-email"
                  placeholder="Email"
                  required
                />
                <label htmlFor="reset-email">Email</label>
              </div>

              <button type="submit" className="btn btn-primary auth-button">
                Reset Password
              </button>
            </form>

            <button 
              className="btn btn-link mt-3"
              onClick={() => setIsFlipped(false)}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
