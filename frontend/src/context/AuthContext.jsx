// src/context/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await authAPI.getMe();
          const user = response?.data?.user || response?.user || null;
          if (!user) throw new Error('Invalid auth response');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              token,
            },
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAILURE' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login(credentials);
      // Accept both { token, data: { user } } and { token, user }
      const token = response?.token ?? response?.data?.token ?? null;
      const user = response?.data?.user ?? response?.user ?? null;
      if (!token || !user) {
        throw new Error('Unexpected login response');
      }
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          token,
        },
      });
      
      return { success: true, data: { user } };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(userData);
      const token = response?.token ?? response?.data?.token ?? null;
      const user = response?.data?.user ?? response?.user ?? null;
      if (!token || !user) {
        throw new Error('Unexpected register response');
      }
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          token,
        },
      });
      
      return { success: true, data: { user } };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Attempt to clear server-side auth cookie/session
      await authAPI.logout();
    } catch (e) {
      // Ignore network/server errors on logout; proceed with local cleanup
      console.warn('Server logout failed, proceeding with local cleanup');
    }

    try {
      // Clear the token from local storage first
      localStorage.removeItem('token');

      // Update the UI state immediately
      dispatch({ type: 'LOGOUT' });

      // Clear any stored user data
      if (window.gapi && window.gapi.auth2) {
        const auth2 = window.gapi.auth2.getAuthInstance();
        if (auth2 != null) {
          await auth2.signOut();
        }
      }

      // Clear any service worker caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }

      // Clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });

      // Redirect to home
      window.location.href = '/';

      // Small delay to ensure the redirect happens
      return new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure we still clear local state even if something goes wrong
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
      return Promise.resolve();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const user = response?.data?.user ?? response?.user ?? null;
      if (user) {
        dispatch({
          type: 'UPDATE_USER',
          payload: user,
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const uploadAvatar = async (avatar) => {
    try {
      const response = await authAPI.uploadAvatar({ avatar });
      const user = response?.data?.user ?? response?.user ?? null;
      if (user) {
        dispatch({
          type: 'UPDATE_USER',
          payload: user,
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};