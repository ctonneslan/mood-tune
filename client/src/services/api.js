import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Mood API
export const moodAPI = {
  create: (moodText) => api.post('/moods', { moodText }),
  getAll: (params) => api.get('/moods', { params }),
  getById: (id) => api.get(`/moods/${id}`),
  delete: (id) => api.delete(`/moods/${id}`),
};

// Playlist API
export const playlistAPI = {
  generate: (data) => api.post('/playlists/generate', data),
  getAll: (params) => api.get('/playlists', { params }),
  getById: (id) => api.get(`/playlists/${id}`),
  delete: (id) => api.delete(`/playlists/${id}`),
};

// Spotify API
export const spotifyAPI = {
  getAuthUrl: () => api.get('/spotify/auth'),
  handleCallback: (code) => api.get(`/spotify/callback?code=${code}`),
  checkStatus: () => api.get('/spotify/status'),
  disconnect: () => api.post('/spotify/disconnect'),
};

export default api;
