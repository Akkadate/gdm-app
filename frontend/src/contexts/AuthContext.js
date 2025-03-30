import React, { createContext, useState, useEffect, useContext } from 'react';
import { login, logout, refreshToken, getUser } from '../services/authService';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is already logged in
        const user = await getUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        // If token is invalid, clear it
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up token refresh interval when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    // Refresh token every 55 minutes (assuming 1-hour token lifetime)
    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (err) {
        console.error('Failed to refresh token:', err);
        // If refresh fails, log user out
        handleLogout();
      }
    }, 55 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  // Login handler
  const handleLogin = async (username, password) => {
    setError(null);
    try {
      const user = await login(username, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Failed to login');
      throw err;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('token');
    }
  };

  // Update user data
  const updateUser = (userData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;