import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogAPI, authAPI } from '../services/api';
import BackButton from '../components/BackButton';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: null,
  });

  // My blogs search & pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Fetch user's blogs
  const { data: myBlogsData, isLoading: isBlogsLoading, error: blogsError } = useQuery({
    queryKey: ['myBlogs', { page, limit, search }],
    queryFn: async () => {
      const { data } = await blogAPI.getMyBlogs({ page, limit, search: search || undefined });
      return data;
    },
    enabled: !!user?._id,
    keepPreviousData: true,
  });

  const myBlogs = myBlogsData?.data?.blogs || myBlogsData?.blogs || [];
  const pagination = myBlogsData?.pagination || { page, limit, totalPages: Math.ceil((myBlogsData?.total || 0) / limit) || 1, hasNext: myBlogs.length === limit, hasPrev: page > 1 };

  // Delete blog mutation
  const deleteBlogMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await blogAPI.deleteBlog(id);
      return data;
    },
    onSuccess: () => {
      toast.success('Blog deleted');
      queryClient.invalidateQueries(['myBlogs']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete blog');
    }
  });

  const handleDeleteBlog = (id) => {
    if (confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      deleteBlogMutation.mutate(id);
    }
  };
  const [avatarPreview, setAvatarPreview] = useState('');

  // Fetch user profile data (via /auth/me)
  const { data: profileResp, isLoading } = useQuery({
    queryKey: ['profile', user?._id],
    queryFn: async () => {
      const res = await authAPI.getMe();
      return res?.data?.user || res?.user || null;
    },
    onSuccess: (u) => {
      if (!u) return;
      setFormData({
        name: u.name || '',
        email: u.email || '',
        bio: u.bio || '',
        avatar: null,
      });
      if (u.avatar) {
        setAvatarPreview(u.avatar);
      }
    },
    enabled: !!user?._id,
  });
  const profile = profileResp;

  const updateProfileMutation = useMutation({
    mutationFn: async (formData) => {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const { data } = await axios.put(`/api/users/${user._id}`, formData, config);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully');
      updateUser(data.user);
      queryClient.invalidateQueries(['profile', user._id]);
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    if (formData.name) formDataToSend.append('name', formData.name);
    if (formData.bio) formDataToSend.append('bio', formData.bio);
    if (formData.avatar) formDataToSend.append('avatar', formData.avatar);

    updateProfileMutation.mutate(formDataToSend);
  };

  if (isLoading || !profile) {
    return <div className="flex justify-center p-8">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4"><BackButton /></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-blue-100">Manage your account information</p>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar Upload */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 mx-auto">
                    <img
                      src={avatarPreview || '/default-avatar.png'}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                    />
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </label>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form
                    setFormData({
                      name: profile.name || '',
                      email: profile.email || '',
                      bio: profile.bio || '',
                      avatar: null,
                    });
                    setAvatarPreview(profile.avatar ? `/uploads/avatars/${profile.avatar}` : '');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 mx-auto">
                    <img
                      src={avatarPreview || '/default-avatar.png'}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                  </div>

                  {profile.bio && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">About</h3>
                      <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Blogs */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Blogs</h2>

        {/* Controls */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search your posts..."
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="w-28 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>

        {isBlogsLoading ? (
          <div className="flex justify-center py-8">Loading your blogs...</div>
        ) : blogsError ? (
          <div className="text-red-500">Failed to load your blogs.</div>
        ) : myBlogs.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">
            You haven't published any blogs yet.{' '}
            <Link to="/create-blog" className="text-blue-600 hover:underline dark:text-blue-400">Create your first post</Link>.
          </div>
        ) : (
          <div className="space-y-4">
            {myBlogs.map((b) => (
              <div key={b._id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <img
                  src={b.image || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=60'}
                  alt={b.title}
                  className="h-16 w-24 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/blog/${b._id}`} className="block font-semibold text-gray-900 dark:text-white truncate hover:underline">
                    {b.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${b.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                      {b.status || 'draft'}
                    </span>
                    <span>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/edit-blog/${b._id}`)}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBlog(b._id)}
                    disabled={deleteBlogMutation.isLoading}
                    className="px-3 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                  >
                    {deleteBlogMutation.isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isBlogsLoading && myBlogs.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page {pagination.page || page} of {pagination.totalPages || 1}</span>
            <button
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50"
              onClick={() => setPage((p) => (pagination.totalPages ? Math.min(pagination.totalPages, p + 1) : p + 1))}
              disabled={!pagination.hasNext}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;