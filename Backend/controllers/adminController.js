// controllers/adminController.js
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalBlogs = await Blog.countDocuments({ isActive: true });
    const totalComments = await Comment.countDocuments({ isActive: true });
    const totalViews = await Blog.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    // Recent blogs
    const recentBlogs = await Blog.find({ isActive: true })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent users
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    // Blog stats by category
    const blogsByCategory = await Blog.aggregate([
      { $match: { isActive: true, status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly blog creation stats
    const monthlyStats = await Blog.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalBlogs,
          totalComments,
          totalViews: totalViews[0]?.totalViews || 0
        },
        recentBlogs,
        recentUsers,
        blogsByCategory,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Role filter
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Status filter
    if (req.query.status) {
      query.isActive = req.query.status === 'active';
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's blog statistics
    const blogStats = await Blog.aggregate([
      { $match: { author: user._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } }
        }
      }
    ]);

    // Get user's recent blogs
    const recentBlogs = await Blog.find({ author: user._id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: blogStats[0] || { totalBlogs: 0, totalViews: 0, totalLikes: 0 },
        recentBlogs
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, bio } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (role) fieldsToUpdate.role = role;
    if (typeof isActive === 'boolean') fieldsToUpdate.isActive = isActive;
    if (bio !== undefined) fieldsToUpdate.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete user
    user.isActive = false;
    await user.save();

    // Soft delete all user's blogs
    await Blog.updateMany(
      { author: req.params.id },
      { isActive: false }
    );

    // Soft delete all user's comments
    await Comment.updateMany(
      { user: req.params.id },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(400).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

// @desc    Get all blogs for admin
// @route   GET /api/admin/blogs
// @access  Private/Admin
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Status filter
    if (req.query.status) {
      if (req.query.status === 'active') {
        query.isActive = true;
      } else if (req.query.status === 'inactive') {
        query.isActive = false;
      } else {
        query.status = req.query.status;
      }
    }

    // Author filter
    if (req.query.author) {
      query.author = req.query.author;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: {
        blogs
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching blogs'
    });
  }
};

// @desc    Update blog status
// @route   PUT /api/admin/blogs/:id/status
// @access  Private/Admin
exports.updateBlogStatus = async (req, res) => {
  try {
    const { status, isActive } = req.body;

    const fieldsToUpdate = {};
    if (status) fieldsToUpdate.status = status;
    if (typeof isActive === 'boolean') fieldsToUpdate.isActive = isActive;

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'name avatar');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        blog
      }
    });
  } catch (error) {
    console.error('Update blog status error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating blog status'
    });
  }
};

// @desc    Get all comments for admin
// @route   GET /api/admin/comments
// @access  Private/Admin
exports.getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Status filter
    if (req.query.status) {
      query.isActive = req.query.status === 'active';
    }

    // Blog filter
    if (req.query.blog) {
      query.blog = req.query.blog;
    }

    const comments = await Comment.find(query)
      .populate('user', 'name avatar email')
      .populate('blog', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: {
        comments
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// @desc    Update comment status
// @route   PUT /api/admin/comments/:id
// @access  Private/Admin
exports.updateCommentStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).populate('user', 'name avatar')
      .populate('blog', 'title');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        comment
      }
    });
  } catch (error) {
    console.error('Update comment status error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating comment status'
    });
  }
};