// src/pages/CreateBlog.jsx
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Eye, Upload, X, Image } from 'lucide-react';
import toast from '../utils/toast';
import { blogAPI, compressAndEncodeImage } from '../services/api';
import QuillEditor from '../components/QuillEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import BackButton from '../components/BackButton';

const CreateBlog = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    status: 'published'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: blogAPI.getCategories
  });

  // Create blog mutation
  const createBlogMutation = useMutation({
    mutationFn: blogAPI.createBlog,
    onSuccess: (data) => {
      toast.success('Blog created successfully!');
      // Invalidate lists so Home (and others) refetch and show the new post
      queryClient.invalidateQueries({ queryKey: ['blogsList'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['myBlogs'] });
      // Navigate to the new blog
      navigate(`/blog/${data.data.blog._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create blog');
    }
  });

  const categories = categoriesData?.data?.categories || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
    if (errors.content) {
      setErrors(prev => ({
        ...prev,
        content: ''
      }));
    }
  };

  const processSelectedFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { // 10MB hard limit before compression
      toast.error('Image size should be less than 10MB');
      return;
    }
    try {
      setImageFile(file);
      // Compress and set preview from compressed data
      const compressedDataUrl = await compressAndEncodeImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      setImagePreview(compressedDataUrl);
    } catch (err) {
      toast.error('Failed to process image');
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    await processSelectedFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    await processSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (!formData.content.trim() || formData.content === '<p><br></p>') {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.excerpt && formData.excerpt.length > 300) {
      newErrors.excerpt = 'Excerpt must be less than 300 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    try {
      let imageData = '';
      if (imageFile) {
        // Use already-compressed preview as payload
        imageData = imagePreview;
      }
      
      const blogData = {
        ...formData,
        tags: formData.tags.trim(),
        image: imageData
      };
      
      createBlogMutation.mutate(blogData);
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleSaveDraft = async () => {
    const draftData = {
      ...formData,
      status: 'draft'
    };
    
    let imageData = '';
    if (imageFile) {
      try {
        imageData = imagePreview;
        draftData.image = imageData;
      } catch (error) {
        toast.error('Failed to process image');
        return;
      }
    }
    
    createBlogMutation.mutate(draftData);
  };

  if (isPreviewMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Preview</h1>
          <button
            onClick={() => setIsPreviewMode(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close Preview
          </button>
        </div>
        
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {imagePreview && (
            <img
              src={imagePreview}
              alt={formData.title}
              className="w-full h-64 object-cover"
            />
          )}
          
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold uppercase">
                {formData.category}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {formData.title || 'Untitled'}
            </h1>
            
            {formData.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 italic">
                {formData.excerpt}
              </p>
            )}
            
            {formData.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {formData.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: formData.content || '<p>No content...</p>' }}
            />
          </div>
        </article>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Blog</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={createBlogMutation.isLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your blog title..."
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Category and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Featured Image
          </label>
          
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Image className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Click to upload an image or drag & drop here
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, JPEG up to 5MB
                </p>
              </label>
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Excerpt
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none ${
              errors.excerpt ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Brief description of your blog (optional)..."
          />
          <div className="flex justify-between mt-1">
            {errors.excerpt && (
              <p className="text-red-500 text-sm">{errors.excerpt}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.excerpt.length}/300
            </p>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter tags separated by commas (e.g., react, javascript, programming)"
          />
          <p className="text-sm text-gray-500 mt-1">
            Separate tags with commas. Use relevant keywords to help people find your blog.
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content *
          </label>
          <QuillEditor
            value={formData.content}
            onChange={handleContentChange}
            placeholder="Start writing your blog content..."
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createBlogMutation.isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {createBlogMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {formData.status === 'draft' ? 'Save Draft' : 'Publish Blog'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateBlog;