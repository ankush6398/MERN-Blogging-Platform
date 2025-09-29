// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import BlogDetails from './pages/BlogDetails';
import CreateBlog from './pages/CreateBlog';
import EditBlog from './pages/EditBlog';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

function App() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <Navbar />
      
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8"
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/blog/:id" element={<BlogDetails />} />
              
              {/* Auth Routes - Only accessible when not logged in */}
              <Route 
                path="/login" 
                element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
              />
              <Route 
                path="/register" 
                element={!isAuthenticated ? <Register /> : <Navigate to="/" />} 
              />
              
              {/* Protected Routes - Only accessible when logged in */}
              <Route 
                path="/create-blog" 
                element={
                  <ProtectedRoute>
                    <CreateBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-blog/:id" 
                element={
                  <ProtectedRoute>
                    <EditBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes - Only accessible by admins */}
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
      </ErrorBoundary>
      
      <ToastContainer position="top-right" autoClose={3500} newestOnTop closeOnClick pauseOnHover theme={isDarkMode ? 'dark' : 'light'} />
    </div>
  );
}

export default App;