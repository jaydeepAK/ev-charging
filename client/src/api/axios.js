// WHY A SHARED AXIOS INSTANCE?
// Instead of writing `axios.get('http://localhost:5000/stations', { headers: {...} })`
// in every single component, every file imports THIS `api` object. It already
// knows the base URL and automatically attaches the JWT to every request via
// an "interceptor" — a function that runs before every request/response.

import axios from 'axios';

// Vite exposes env vars prefixed with VITE_ via import.meta.env.
// Falls back to localhost so it works out of the box in dev.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({ baseURL });

// Request interceptor: runs before every outgoing request.
// Reads the token from localStorage and attaches it as Authorization header —
// this is what replaces manually pasting "Bearer <token>" into curl.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if the backend ever says 401 (invalid/expired token),
// automatically log the user out client-side rather than showing a confusing
// half-broken page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Full reload to reset all React state cleanly and bounce to login.
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
