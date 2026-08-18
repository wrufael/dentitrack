// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { Accept: 'application/json' },
});

// -----------------------------------------------------------------
// THE FIX: attach the token the instant this module is imported —
// not inside a React useEffect. Effects fire child-before-parent, so
// an effect-based approach loses the race against child components
// that call the API on their own mount (Sidebar, Dashboard, etc).
// This line runs once, synchronously, before any component renders.
// -----------------------------------------------------------------
const existingToken = localStorage.getItem('token');
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// Belt-and-suspenders: also attach per-request in case defaults ever
// get cleared out from under us (e.g. during logout of another tab).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Only treat a REAL 401 from the server as "logged out" — never
// short-circuit this during the page's very first render.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;