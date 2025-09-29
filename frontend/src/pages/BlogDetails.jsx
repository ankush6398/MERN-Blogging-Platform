import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BackButton from '../components/BackButton';
import BlogActions from '../components/BlogActions';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  
  const { data: blog, error, isLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/blogs/${id}`);
      return data;
    },
    enabled: !!id,
    select: (data) => {
      const blogData = data.data?.blog || data;
      return {
        ...data,
        isLiked: blogData.likes?.some(like => like._id === user?._id || like === user?._id),
        likes: blogData.likes || [],
        comments: blogData.comments || []
      };
    }
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load blog post');
      navigate('/');
    }
  }, [error, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!blog) {
    return <div>Blog post not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <BackButton />
        </div>
        
        {/* Enhanced Article Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <article className="prose dark:prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              {blog.data?.blog?.title || blog.title}
            </h1>
            
            {/* Enhanced Author Info */}
            <div className="flex items-center justify-between mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(blog.data?.blog?.author?.name || blog.author?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {blog.data?.blog?.author?.name || blog.author?.name || 'Unknown Author'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {blog.data?.blog?.createdAt ? new Date(blog.data.blog.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown Date'}
                  </p>
                </div>
              </div>
              
              {/* Reading Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>5 min read</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>1.2k views</span>
                </span>
              </div>
            </div>
          </article>
        </div>
        
        {/* Enhanced Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: blog.data?.blog?.content || blog.content }}
          />
          
          {/* Blog Actions - Like, Comment, Share */}
          <BlogActions 
            blogId={id}
            initialLikes={blog.data?.blog?.likes || blog.likes || []}
            initialComments={blog.data?.blog?.comments || blog.comments || []}
            isLiked={blog.isLiked}
            currentUserId={user?._id}
          />
        </div>
        
        {/* Enhanced Footer */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>Like</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Comment</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Published on {blog.data?.blog?.createdAt ? new Date(blog.data.blog.createdAt).toLocaleDateString() : blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'Unknown Date'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;