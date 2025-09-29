// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters'],
    minlength: [1, 'Comment cannot be empty']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
commentSchema.index({ blog: 1, createdAt: -1 });
commentSchema.index({ user: 1 });

// Pre middleware for populate
commentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name avatar'
  });
  next();
});

module.exports = mongoose.model('Comment', commentSchema);