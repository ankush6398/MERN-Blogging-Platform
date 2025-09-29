// routes/adminRoutes.js
const express = require('express');
const {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getBlogs,
  updateBlogStatus,
  getComments,
  updateCommentStatus
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// Dashboard
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Blog management
router.get('/blogs', getBlogs);
router.put('/blogs/:id/status', updateBlogStatus);

// Comment management
router.get('/comments', getComments);
router.put('/comments/:id', updateCommentStatus);

module.exports = router;