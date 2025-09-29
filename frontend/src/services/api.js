// src/services/api.js
import axios from 'axios';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Prevent sending a raw JWT string as request body (which breaks body-parser)
    const looksLikeJwt = (str) => typeof str === 'string' && /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(str.replace(/^"|"$/g, ''));
    if (looksLikeJwt(config.data)) {
      config.data = {};
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Show error toast for non-401 errors
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  adminTempLogin: (credentials) => api.post('/auth/admin-temp-login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  uploadAvatar: (avatar) => api.post('/auth/avatar', avatar),
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
};

// Blog API
export const blogAPI = {
  getBlogs: (params) => api.get('/blogs', { params }),
  searchBlogs: (params) => api.get('/blogs/search', { params }),
  getBlog: (id) => api.get(`/blogs/${id}`),
  createBlog: (blogData) => api.post('/blogs', blogData),
  uploadInlineImage: (dataUrl) => api.post('/blogs/upload', { image: dataUrl }),
  updateBlog: (id, blogData) => api.put(`/blogs/${id}`, blogData),
  deleteBlog: (id) => api.delete(`/blogs/${id}`),
  likeBlog: (id) => api.post(`/blogs/${id}/like`),
  addComment: (id, comment) => api.post(`/blogs/${id}/comment`, comment),
  deleteComment: (blogId, commentId) => api.delete(`/blogs/${blogId}/comment/${commentId}`),
  getUserBlogs: (userId, params) => api.get(`/blogs/user/${userId}`, { params }),
  // match backend route: router.get('/my/blogs', getMyBlogs)
  getMyBlogs: (params) => api.get('/blogs/my/blogs', { params }),
  getCategories: () => api.get('/blogs/categories'),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getBlogs: (params) => api.get('/admin/blogs', { params }),
  updateBlogStatus: (id, statusData) => api.put(`/admin/blogs/${id}/status`, statusData),
  getComments: (params) => api.get('/admin/comments', { params }),
  updateCommentStatus: (id, statusData) => api.put(`/admin/comments/${id}`, statusData),
};

// Upload helper function
export const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Image compression utility: returns a Base64 data URL after resizing and compressing
export const compressAndEncodeImage = (file, { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          // Maintain aspect ratio within bounds
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG to shrink size further
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
};

export default api;