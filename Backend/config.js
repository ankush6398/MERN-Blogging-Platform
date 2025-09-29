// config.js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/blogplatform',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'demo',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'demo',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Temporary admin access (use only in dev/staging)
  TEMP_ADMIN_ENABLED: process.env.TEMP_ADMIN_ENABLED === 'true',
  TEMP_ADMIN_EMAIL: process.env.TEMP_ADMIN_EMAIL || '',
  TEMP_ADMIN_PASSWORD: process.env.TEMP_ADMIN_PASSWORD || '',
  TEMP_ADMIN_NAME: process.env.TEMP_ADMIN_NAME || 'Temp Admin'
};