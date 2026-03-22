import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/Client.js';

const AuthContext = createContext();

const TOKEN_KEY = 'snackoverflow_admin_token';
const EMAIL_KEY = 'snackoverflow_admin_email';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Initialize user SYNCHRONOUSLY from localStorage to avoid
  // ProtectedRoute redirecting on first render before useEffect fires
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const email = localStorage.getItem(EMAIL_KEY);
    return token ? { token, email } : null;
  });

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(EMAIL_KEY, email);
    setUser({ email, token: data.token });
    navigate('/campaigns');
  };

  const signup = async (email, password) => {
    const data = await authAPI.signup(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(EMAIL_KEY, email);
    setUser({ email, token: data.token });
    navigate('/campaigns');
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    window.location.href = '/';
  };

  const changePassword = async (oldPassword, newPassword) => {
    await authAPI.changePassword(oldPassword, newPassword);
    // Force logout after password change — all tokens are now invalidated
    logout();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);