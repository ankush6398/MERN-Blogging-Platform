import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight } from 'lucide-react';
import { blogAPI } from '../services/api';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import TextFlipper from '../components/TextFlipper';
import FlippyButton from '../components/FlippyButton';
import Reveal from '../components/Reveal';
import CounterStat from '../components/CounterStat';
import LogoMarquee from '../components/LogoMarquee';
import BlogCard from '../components/BlogCard';
import { trustedLogos } from '../data/trustedLogos';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Categories for filtering
  const categories = [
    { _id: 'all', name: 'All' },
    { _id: 'technology', name: 'Technology' },
    { _id: 'lifestyle', name: 'Lifestyle' },
    { _id: 'travel', name: 'Travel' },
    { _id: 'food', name: 'Food' },
  ];

  // Fetch blogs
  const { 
    data: blogsData, 
    isLoading: blogsLoading, 
    error: blogsError 
  } = useQuery({
    queryKey: ['blogsList', { page: currentPage, q: debouncedQuery, category: selectedCategory }],
    queryFn: () => {
      const hasFilters = (debouncedQuery && debouncedQuery.trim() !== '') || selectedCategory !== 'all';
      if (hasFilters) {
        return blogAPI.searchBlogs({
          page: currentPage,
          limit: 9,
          q: debouncedQuery || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        });
      }
      return blogAPI.getBlogs({ page: currentPage, limit: 9, sort: 'newest' });
    }
  });

  const blogs = blogsData?.data?.blogs || [];
  const pagination = blogsData?.pagination || {};

  if (blogsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Error loading blogs. Please try again.</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-400/20 blur-3xl" />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNMCAwaDYwdjYwSDB6IiBmaWxsPSJub25lIiBzdHJva2U9IiM3MzczM2MiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4yIi8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz4KPC9zdmc+')]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <Reveal>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400">Write.</span>{' '}
                <TextFlipper className="ml-1" words={["Create","Share","Inspire","Discover"]} />
                {' '}your story.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                A modern blogging platform with rich editor, image uploads, and a vibrant community.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-10 flex items-center justify-center gap-4">
                <FlippyButton onClick={() => document.getElementById('featured')?.scrollIntoView({behavior:'smooth'})}>
                  Start Reading
                </FlippyButton>
                <a
                  href="/create-blog"
                  className="inline-flex items-center px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Create a Post
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6"><BackButton /></div>
        {/* Search and Categories */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category._id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{getCategoryEmoji(category._id)}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Features section */}
        <section className="mb-16" aria-label="Key features">
          <Reveal>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Why you'll love it</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[{
              title: 'Rich Editor',
              desc: 'Beautiful formatting with images, code blocks, and more using React Quill.',
              emoji: '✍️'
            },{
              title: 'Image Uploads',
              desc: 'Inline and featured images powered by Cloudinary for speed and quality.',
              emoji: '🖼️'
            },{
              title: 'Secure Auth',
              desc: 'JWT cookie-based authentication with role support and protected routes.',
              emoji: '🔐'
            },{
              title: 'Lightning Fast',
              desc: 'Vite + React + Tailwind deliver a snappy experience.',
              emoji: '⚡'
            },{
              title: 'Engagement',
              desc: 'Likes and comments to connect with your readers.',
              emoji: '💬'
            },{
              title: 'Mobile Friendly',
              desc: 'Responsive design that looks great on any device.',
              emoji: '📱'
            }].map((f) => (
              <Reveal key={f.title}>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-3">{f.emoji}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Stats section */}
        <section className="mb-16" aria-label="Platform stats">
          <Reveal>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Growing every day</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <CounterStat end={1200} label="Active Writers" />
            <CounterStat end={8750} label="Posts Published" />
            <CounterStat end={32500} label="Comments" />
            <CounterStat end={98} suffix="%" label="Satisfaction" />
          </div>
        </section>

        {/* Trusted by logos */}
        <section className="mb-20" aria-label="Trusted by">
          <Reveal>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Trusted by creators from
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Join thousands of writers who trust our platform
              </p>
            </div>
          </Reveal>
          
          {/* Enhanced logo marquee with better styling */}
          <div className="relative bg-gradient-to-r from-gray-50/50 via-white/80 to-gray-50/50 dark:from-gray-800/50 dark:via-gray-700/80 dark:to-gray-800/50 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/40 to-transparent dark:via-blue-900/20 rounded-3xl"></div>
            <LogoMarquee 
              logos={trustedLogos} 
              size={52} 
              invertDark 
              speed={25}
              grayscale={false}
            />
          </div>
        </section>

          {/* Latest Posts */}
          <section id="featured">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Latest Articles</h2>
            {/* Blog Posts */}
        {blogsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : blogsError ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading blog posts. Please try again later.</p>
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog, index) => (
              <BlogCard key={blog._id} blog={blog} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No blog posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Check back later for new posts!'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </nav>
        </div>
      )}
      </main>
    </div>
  );
};

// Helper function to get emoji for categories
const getCategoryEmoji = (category) => {
  const emojiMap = {
    technology: '💻',
    lifestyle: '🌟',
    travel: '✈️',
    food: '🍽️',
    health: '🏥',
    business: '💼',
    entertainment: '🎬',
    sports: '⚽',
    politics: '🏛️',
    education: '📚',
    science: '🔬',
    other: '📝'
  };
  return emojiMap[category] || '📝';
};

export default Home;
