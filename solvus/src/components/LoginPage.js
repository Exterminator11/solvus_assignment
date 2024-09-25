import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import './LoginPage.css';

const LoginPage = ({ onLogin, onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login-page">
      <header className="header">
        <h1 className="logo">Mediscribe</h1>
      </header>
      <main className="main-content">
        <div className="login-card">
          <h2 className="login-title">Login</h2>
          <form onSubmit={handleLogin} className="login-form">
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
            <Button type="submit" className="login-button">
              Login
            </Button>
          </form>
          <Button onClick={onRegisterClick} className="register-button mt-3">
            Register New Account
          </Button>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;