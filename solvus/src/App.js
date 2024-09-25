import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import HomePage from './components/HomePage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUser(user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in:', error.message);
      // Handle login error (e.g., show error message to user)
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error.message);
      // Handle logout error
    }
  };

  const handleRegistrationSuccess = (user) => {
    setIsLoggedIn(true);
    setUser(user);
    setShowRegistration(false);
  };

  if (isLoggedIn) {
    return <HomePage onLogout={handleLogout} user={user} />;
  }

  if (showRegistration) {
    return (
      <RegistrationPage 
        onRegistrationSuccess={handleRegistrationSuccess}
        onBackToLogin={() => setShowRegistration(false)}
      />
    );
  }

  return (
    <LoginPage 
      onLogin={handleLogin} 
      onRegisterClick={() => setShowRegistration(true)}
    />
  );
};

export default App;
