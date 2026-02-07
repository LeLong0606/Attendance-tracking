import axios from 'axios';
import { API_BASE_URL, STORAGE_TOKEN, COOKIE_REFRESH_TOKEN } from './constants';

// Decode JWT token
export const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    const decoded = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Get user info from stored access token
export const getUserFromToken = () => {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (!token) {
      return null;
    }
    
    const decoded = decodeToken(token);
    if (!decoded) {
      return null;
    }
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.warn('Token expired');
      localStorage.removeItem(STORAGE_TOKEN);
      return null;
    }
    
    return {
      id: decoded.sub,
      username: decoded.unique_name,
      email: decoded.email,
      permissions: decoded.permissions || [],
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

// Helper function to get cookie value
const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

// Cookie Management utilities
export const cookieManager = {
  getCookie,
  
  setCookie: (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Strict`;
  },
  
  deleteCookie: (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },
  
  getAllCookies: () => {
    const cookies = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        cookies[name] = decodeURIComponent(value || '');
      }
    });
    return cookies;
  }
};

// Create axios instance for auth
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token and refresh token
authAxios.interceptors.request.use(
  (config) => {
    // Add Bearer token from localStorage
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add Refresh token from cookies
    const refreshToken = getCookie(COOKIE_REFRESH_TOKEN);
    if (refreshToken) {
      config.headers['X-Refresh-Token'] = refreshToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await authAxios.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  logout: async (refreshToken) => {
    try {
      const response = await authAxios.post('/auth/logout', { refreshToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
