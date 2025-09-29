// models/Blog.js
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot be more than 300 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
    ]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  image: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  readTime: {
    type: Number, // in minutes
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments
blogSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'blog',
  justOne: false
});

// Virtual for likes count
blogSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comments count
blogSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Index for search
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ author: 1 });

// Pre middleware to calculate read time
blogSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(' ').length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute) || 1;
  }
  
  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 297) + '...';
  }
  
  next();
});

// Pre middleware for populate
blogSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'name avatar'
  });
  next();
});

module.exports = mongoose.model('Blog', blogSchema);