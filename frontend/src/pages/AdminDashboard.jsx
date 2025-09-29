import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { adminAPI, authAPI } from '../services/api';
import toast from '../utils/toast';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [blogs, setBlogs] = useState([]);
  const [users, setUsers] = useState([]);

  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [activeTab, setActiveTab] = useState('blogs'); // 'blogs' | 'users'

  const [blogQuery, setBlogQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  const reload = () => setRefreshKey((k) => k + 1);

  // Admin check via /auth/me
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await authAPI.getMe();
        if (!isMounted) return;
        if (res?.data?.user?.role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error('Admin access required');
          navigate('/');
        }
      } catch (e) {
        // api interceptor will redirect on 401
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Fetch blogs and users
  useEffect(() => {
    if (!isAdmin) return;
    const fetchBlogs = async () => {
      setLoadingBlogs(true);
      try {
        const res = await adminAPI.getBlogs({ limit: 100, search: blogQuery || undefined });
        setBlogs(res?.data?.blogs || []);
      } catch (e) {
        // error handled globally
      } finally {
        setLoadingBlogs(false);
      }
    };
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await adminAPI.getUsers({ limit: 100, search: userQuery || undefined });
        setUsers(res?.data?.users || []);
      } catch (e) {
        // error handled globally
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchBlogs();
    fetchUsers();
  }, [isAdmin, blogQuery, userQuery, refreshKey]);

  const handleDeleteBlog = async (id) => {
    const ok = confirm('Are you sure you want to delete this blog? This will deactivate it.');
    if (!ok) return;
    try {
      await adminAPI.updateBlogStatus(id, { isActive: false });
      toast.success('Blog deleted');
      reload();
    } catch (e) {}
  };

  const handleDeleteUser = async (id) => {
    const ok = confirm('Are you sure you want to delete this user? This will deactivate their account and content.');
    if (!ok) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      reload();
    } catch (e) {}
  };

  const filteredBlogs = useMemo(() => blogs, [blogs]);
  const filteredUsers = useMemo(() => users, [users]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded w-32 mb-4" />
          <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-3 py-1 rounded border text-sm ${
              activeTab === 'blogs'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
            }`}
          >
            Blogs
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded border text-sm ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
            }`}
          >
            Users
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'blogs' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">All Blogs</h2>
              <input
                type="text"
                value={blogQuery}
                onChange={(e) => setBlogQuery(e.target.value)}
                placeholder="Search blogs..."
                className="px-3 py-2 border rounded w-64 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-sm"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50 dark:bg-gray-900">
                    <th className="p-3">Title</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Views</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBlogs ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">Loading blogs...</td>
                    </tr>
                  ) : filteredBlogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">No blogs found</td>
                    </tr>
                  ) : (
                    filteredBlogs.map((b) => (
                      <tr key={b._id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="p-3 font-medium">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[260px]">{b.title}</span>
                            <span className="text-xs text-gray-500">{b._id}</span>
                          </div>
                        </td>
                        <td className="p-3">{b.author?.name || '—'}</td>
                        <td className="p-3 capitalize">{b.category}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {b.isActive ? b.status : 'inactive'}
                          </span>
                        </td>
                        <td className="p-3">{b.views}</td>
                        <td className="p-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteBlog(b._id)}
                            className="px-3 py-1 text-red-700 border border-red-200 hover:bg-red-50 rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">All Users</h2>
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search users..."
                className="px-3 py-2 border rounded w-64 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-sm"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50 dark:bg-gray-900">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">Loading users...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {u.avatar && (
                              <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            )}
                            <div className="flex flex-col">
                              <span>{u.name}</span>
                              <span className="text-xs text-gray-500">{u._id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3 capitalize">{u.role}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {u.isActive ? 'active' : 'inactive'}
                          </span>
                        </td>
                        <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="px-3 py-1 text-red-700 border border-red-200 hover:bg-red-50 rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;