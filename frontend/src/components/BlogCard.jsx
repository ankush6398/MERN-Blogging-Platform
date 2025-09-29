// src/components/BlogCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const BlogCard = ({ blog, index = 0 }) => {
  const navigate = useNavigate();
  const {
    _id,
    title,
    excerpt,
    image,
    author,
    category,
    tags,
    likesCount,
    commentsCount,
    views,
    createdAt,
    readTime,
  } = blog;

  const handleCardClick = () => {
    console.log('Card clicked!');
    console.log('Blog data:', blog);
    console.log('Blog ID:', _id);
    console.log('Navigating to:', `/blog/${_id}`);
    
    if (_id) {
      navigate(`/blog/${_id}`);
    } else {
      console.error('No blog ID found!');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 cursor-pointer h-full"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-52">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Category badge with enhanced styling */}
        <span className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
          {category}
        </span>
        
        {/* Reading time badge */}
        <span className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          {readTime || "5 min read"}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-4">
        {/* Title */}
        <h3 className="text-xl font-bold line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
            <Calendar size={14} className="text-blue-500" />
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          <span className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
            <User size={14} className="text-green-500" />
            {author?.name || "Unknown"}
          </span>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
              <Heart size={16} className="text-red-500" /> 
              <span className="font-medium">{likesCount || 0}</span>
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
              <MessageCircle size={16} className="text-blue-500" /> 
              <span className="font-medium">{commentsCount || 0}</span>
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors">
              <Eye size={16} className="text-green-500" /> 
              <span className="font-medium">{views || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
