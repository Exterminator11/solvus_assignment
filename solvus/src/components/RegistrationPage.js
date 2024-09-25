import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../App'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import './RegistrationPage.css'; 

const RegistrationPage = ({ onRegistrationSuccess, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User registered:', user);
      onRegistrationSuccess(user);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="registration-page">
      <header className="header">
        <h1 className="logo">Mediscribe</h1>
      </header>
      <main className="main-content">
        <div className="registration-card">
          <h2 className="registration-title">Register</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleRegister} className="registration-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="register-button">
              Register
            </Button>
          </form>
          <Button onClick={onBackToLogin} className="back-to-login-button mt-3">
            Back to Login
          </Button>
        </div>
      </main>
    </div>
  );
};

export default RegistrationPage;