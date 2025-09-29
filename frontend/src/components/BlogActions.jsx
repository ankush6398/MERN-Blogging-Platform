import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blogAPI } from '../services/api';
import toast from '../utils/toast';

const BlogActions = ({ blogId, initialLikes = [], initialComments = [], isLiked: initialIsLiked = false, currentUserId }) => {
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [comment, setComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [likes, setLikes] = useState(initialLikes);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => blogAPI.likeBlog(blogId),
    onSuccess: (data) => {
      setIsLiked(data.isLiked);
      setLikes(data.likes);
      queryClient.invalidateQueries(['blog', blogId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to like the blog');
    }
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (commentText) => blogAPI.addComment(blogId, { text: commentText }),
    onSuccess: (data) => {
      setComments([...comments, data.comment]);
      setComment('');
      setShowCommentForm(false);
      queryClient.invalidateQueries(['blog', blogId]);
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async ({blogId, commentId}) => {
      console.log('Deleting comment with params:', { blogId, commentId });
      try {
        // Ensure both parameters are passed correctly
        if (!blogId || !commentId) {
          throw new Error('Missing required parameters for comment deletion');
        }
        const response = await blogAPI.deleteComment(blogId, commentId);
        console.log('Delete comment response:', response);
        return response;
      } catch (error) {
        console.error('Delete comment API error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
        throw error;
      }
    },
    onSuccess: (_, {commentId}) => {
      setComments(comments.filter(c => c._id !== commentId));
      queryClient.invalidateQueries(['blog', blogId]);
      toast.success('Comment deleted successfully');
    },
    onError: (error, { commentId }) => {
      console.error('Delete comment error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      // If backend says it's already deleted, treat as success locally
      if (status === 404 && /already been deleted/i.test(message || '')) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        queryClient.invalidateQueries(['blog', blogId]);
        toast.info('Comment was already deleted');
        return;
      }
      console.log('Error details:', {
        status,
        data: error.response?.data,
        message
      });
      toast.error(message || 'Failed to delete comment');
    }
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate(comment.trim());
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUserId) {
      toast.error('You must be logged in to delete comments');
      return;
    }

    // Find the comment being deleted
    const commentToDelete = comments.find(c => c._id === commentId);
    
    // Debug logging
    console.log('Current User ID:', currentUserId);
    console.log('Comment to delete:', commentToDelete);
    console.log('Blog ID for deletion:', blogId);
    
    if (commentToDelete?.user) {
      const commentUserId = commentToDelete.user._id || commentToDelete.user;
      console.log('Comment User ID (from comment.user):', commentUserId);
      console.log('Current User ID (type):', typeof currentUserId);
      console.log('Comment User ID (type):', typeof commentUserId);
      console.log('Is current user the comment author?', 
        commentUserId?.toString() === currentUserId?.toString());
    } else {
      console.log('Comment user data not found or malformed');
    }

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        console.log('Attempting to delete comment with ID:', commentId);
        // Ensure we're passing the correct parameters
        await deleteCommentMutation.mutateAsync({
          blogId: blogId,
          commentId: commentId
        });
      } catch (error) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        toast.error(error.response?.data?.message || 'Failed to delete comment');
      }
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this blog post',
          text: 'I found this interesting blog post and wanted to share it with you!',
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Like and Share Buttons */}
      <div className="flex items-center space-x-6">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isLiked 
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          disabled={likeMutation.isPending}
        >
          <svg 
            className="w-6 h-6" 
            fill={isLiked ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          <span>{likes?.length || 0} {likes?.length === 1 ? 'Like' : 'Likes'}</span>
        </button>

        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{comments?.length || 0} {comments?.length === 1 ? 'Comment' : 'Comments'}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Leave a Comment</h3>
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment here..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCommentForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                disabled={commentMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={!comment.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments Section */}
      {comments?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white border-b pb-2">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h3>
          <div className="space-y-6">
            {comments.map((comment) => {
              // Safely handle cases where comment or user data might be missing
              const commentId = comment?._id || Math.random().toString(36).substr(2, 9);
              const userName = comment?.user?.name || 'Anonymous';
              const userInitial = userName.charAt(0).toUpperCase();
              const commentDate = comment?.createdAt ? new Date(comment.createdAt) : new Date();
              const commentUserId = comment?.user?._id || comment?.user;
              const isCurrentUser = commentUserId && currentUserId && 
                commentUserId.toString() === currentUserId.toString();
              
              return (
                <div key={commentId} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {userInitial}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {userName}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {commentDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {isCurrentUser && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        disabled={deleteCommentMutation.isPending}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-gray-700 dark:text-gray-300">{comment?.text || 'No comment text available'}</p>
                </div>
              );
            })}

          </div>
        </div>
      )}
    </div>
  );
};

export default BlogActions;
