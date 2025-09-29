// routes/authRoutes.js
const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  adminTempLogin
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin-temp-login', adminTempLogin);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar);
router.put('/password', changePassword);

module.exports = router;