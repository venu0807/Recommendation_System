import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from './Context';

const Register = () => {
  const { registerUser, formData, handleChange } = useContext(UserContext);
  const [step, setStep] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      registerUser(e, formData);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2 className="auth-title">Create Account</h2>
        <div className="progress-bar-container mb-4">
          <div className="progress" style={{ height: '3px' }}>
            <div 
              className="progress-bar" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <div className="form-step">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                />
                <label>Choose Username</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                />
                <label>Email Address</label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="First Name"
                  required
                />
                <label>First Name</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Last Name"
                  required
                />
                <label>Last Name</label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
                <label>Create Password</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                />
                <label>Confirm Password</label>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            {step > 1 && (
              <button 
                type="button" 
                className="btn btn-outline-primary"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {step === 3 ? 'Create Account' : 'Next'}
            </button>
          </div>
        </form>

        <div className="auth-links mt-4">
          <Link to="/login" className="btn btn-link">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
