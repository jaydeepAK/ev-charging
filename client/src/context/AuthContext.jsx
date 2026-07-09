// WHAT IS CONTEXT?
// Normally React data flows one way: parent -> child via props. If Navbar,
// Stations, MyBookings, and 5 other components all need to know "who is
// logged in," passing that down through props at every level ("prop
// drilling") gets messy fast. Context lets any component, anywhere in the
// tree, read this data directly with one hook call — useAuth() — no matter
// how deep it's nested.
//
// The pattern: createContext() makes the "channel," a Provider component
// wraps your whole app and supplies the actual value, and useContext (here
// wrapped as useAuth) is how descendants read it.

import { createContext, useContext, useState } from 'react';
import { api } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Lazy initial state: read whatever was saved in localStorage on page load,
  // so refreshing the page doesn't log you out.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook wrapping useContext — lets components just call useAuth()
// instead of importing AuthContext + useContext everywhere.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
