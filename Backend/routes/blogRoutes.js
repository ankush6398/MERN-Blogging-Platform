// routes/blogRoutes.js
const express = require('express');
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  addComment,
  deleteComment,
  getUserBlogs,
  getMyBlogs,
  getCategories,
  uploadInlineImage,
  searchBlogs
} = require('../controllers/blogController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getBlogs);
router.get('/search', optionalAuth, searchBlogs);
router.get('/categories', getCategories);
router.get('/user/:userId', getUserBlogs);
router.get('/:id', optionalAuth, getBlog);

// Protected routes
router.use(protect);
router.post('/upload', uploadInlineImage);
router.post('/', createBlog);
router.get('/my/blogs', getMyBlogs);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.post('/:id/like', toggleLike);

router.post('/:id/comment', addComment);
router.delete('/:blogId/comment/:commentId', deleteComment);

module.exports = router;