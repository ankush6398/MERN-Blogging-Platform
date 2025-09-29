// controllers/blogController.js
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configure Cloudinary
if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('Cloudinary credentials not configured. Image upload will not work.');
}

// @desc    Search blogs by title/content and optional category
// @route   GET /api/blogs/search
// @access  Public
exports.searchBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

    // Base query: only active and published for public search
    const query = { isActive: true, status: 'published' };

    if (q) {
      // Case-insensitive partial match on title or content
      let regex = null;
      try {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, 'i');
      } catch (e) {
        regex = null;
      }
      if (regex) {
        query.$or = [{ title: regex }, { content: regex }];
      }
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const sortBy = { createdAt: -1 };

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name avatar')
        .sort(sortBy)
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(query)
    ]);

    return res.status(200).json({
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
      data: { blogs }
    });
  } catch (error) {
    console.error('Search blogs error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Error searching blogs' });
  }
};

// @desc    Upload inline image for editor
// @route   POST /api/blogs/upload
// @access  Private
exports.uploadInlineImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || !image.startsWith('data:')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image payload'
      });
    }

    // Check if Cloudinary is configured
    if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
      return res.status(400).json({
        success: false,
        message: 'Image upload service not configured. Please contact administrator.'
      });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'blog-platform/inline',
      width: 1600,
      crop: 'limit'
    });

    return res.status(201).json({
      success: true,
      data: {
        url: result.secure_url
      }
    });
  } catch (error) {
    console.error('Upload inline image error:', error);
    return res.status(400).json({
      success: false,
      message: 'Image upload failed'
    });
  }
};

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true, status: 'published' };

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Author filter
    if (req.query.author) {
      query.author = req.query.author;
    }

    // Tag filter
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }

    // Sort options
    let sortBy = { createdAt: -1 };
    if (req.query.sort === 'popular') {
      sortBy = { views: -1, likesCount: -1 };
    } else if (req.query.sort === 'oldest') {
      sortBy = { createdAt: 1 };
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar')
      .populate('comments')
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
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

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name avatar bio')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name avatar'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!blog || !blog.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count
    blog.views += 1;
    await blog.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        blog
      }
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching blog'
    });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category, tags, image, excerpt, status } = req.body;

    let imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';

    // Upload image if provided
    if (image && image.startsWith('data:')) {
      // Check if Cloudinary is configured
      if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
        return res.status(400).json({
          success: false,
          message: 'Image upload service not configured. Please contact administrator.'
        });
      }
      
      const result = await cloudinary.uploader.upload(image, {
        folder: 'blog-platform/blogs',
        width: 800,
        height: 400,
        crop: 'fill'
      });
      imageUrl = result.secure_url;
    } else if (image && !image.startsWith('data:')) {
      imageUrl = image;
    }

    const blog = await Blog.create({
      title,
      content,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      image: imageUrl,
      excerpt,
      status: status || 'published',
      author: req.user.id
    });

    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      data: {
        blog: populatedBlog
      }
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating blog'
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }

    const { title, content, category, tags, image, excerpt, status } = req.body;
    const fieldsToUpdate = {};

    if (title) fieldsToUpdate.title = title;
    if (content) fieldsToUpdate.content = content;
    if (category) fieldsToUpdate.category = category;
    if (tags) fieldsToUpdate.tags = tags.split(',').map(tag => tag.trim());
    if (excerpt) fieldsToUpdate.excerpt = excerpt;
    if (status) fieldsToUpdate.status = status;

    // Handle image upload
    if (image && image.startsWith('data:')) {
      // Check if Cloudinary is configured
      if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
        return res.status(400).json({
          success: false,
          message: 'Image upload service not configured. Please contact administrator.'
        });
      }
      
      const result = await cloudinary.uploader.upload(image, {
        folder: 'blog-platform/blogs',
        width: 800,
        height: 400,
        crop: 'fill'
      });
      fieldsToUpdate.image = result.secure_url;
    } else if (image && !image.startsWith('data:')) {
      fieldsToUpdate.image = image;
    }

    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'name avatar');

    res.status(200).json({
      success: true,
      data: {
        blog
      }
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating blog'
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }

    // Soft delete - set isActive to false
    blog.isActive = false;
    await blog.save();

    // Also delete all comments for this blog
    await Comment.updateMany(
      { blog: req.params.id },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(400).json({
      success: false,
      message: 'Error deleting blog'
    });
  }
};

// @desc    Like/Unlike blog
// @route   POST /api/blogs/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog || !blog.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const userId = req.user.id;
    const likeIndex = blog.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      blog.likes.splice(likeIndex, 1);
    } else {
      // Like
      blog.likes.push(userId);
    }

    await blog.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        likes: blog.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(400).json({
      success: false,
      message: 'Error toggling like'
    });
  }
};

// @desc    Add comment to blog
// @route   POST /api/blogs/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog || !blog.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const comment = await Comment.create({
      user: req.user.id,
      blog: req.params.id,
      text: text.trim()
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      data: {
        comment: populatedComment
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error adding comment'
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/blogs/:blogId/comment/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    console.log('Delete comment request received:', {
      params: req.params,
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      console.log('Comment not found:', req.params.commentId);
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (!comment.isActive) {
      console.log('Comment already deleted:', comment._id);
      return res.status(404).json({
        success: false,
        message: 'Comment has already been deleted'
      });
    }

    // Derive the comment author's user id reliably (handles populated doc or raw ObjectId)
    const commentUserId = (comment.user && comment.user._id) ? comment.user._id.toString() : comment.user.toString();

    // Log the IDs for debugging
    console.log('Comment details:', {
      commentId: comment._id,
      commentUser: commentUserId,
      commentUserType: typeof (comment.user && comment.user._id ? comment.user._id : comment.user),
      requestUser: req.user.id,
      requestUserType: typeof req.user.id,
      userRole: req.user.role,
      isSameUser: commentUserId === req.user.id.toString(),
      isAdmin: req.user.role === 'admin'
    });

    // Check if user is comment owner or admin
    const isCommentOwner = commentUserId === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isCommentOwner && !isAdmin) {
      console.log('Unauthorized delete attempt:', {
        commentUser: comment.user.toString(),
        currentUser: req.user.id,
        isAdmin: isAdmin
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment. Only the comment owner or admin can delete.'
      });
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    console.log('Comment deleted successfully:', comment._id);
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's blogs
// @route   GET /api/blogs/user/:userId
// @access  Public
exports.getUserBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      author: req.params.userId,
      isActive: true,
      status: 'published'
    };

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar')
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
    console.error('Get user blogs error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching user blogs'
    });
  }
};

// @desc    Get my blogs (including drafts)
// @route   GET /api/blogs/my
// @access  Private
exports.getMyBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      author: req.user.id,
      isActive: true
    };

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar')
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
    console.error('Get my blogs error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching your blogs'
    });
  }
};

// @desc    Get blog categories
// @route   GET /api/blogs/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'technology',
      'lifestyle',
      'travel',
      'food',
      'health',
      'business',
      'entertainment',
      'sports',
      'politics',
      'education',
      'science',
      'other'
    ];

    // Get category counts
    const categoryCounts = await Blog.aggregate([
      {
        $match: { isActive: true, status: 'published' }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoriesWithCounts = categories.map(category => {
      const found = categoryCounts.find(item => item._id === category);
      return {
        name: category,
        count: found ? found.count : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithCounts
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};