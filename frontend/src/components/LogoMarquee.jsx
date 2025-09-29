// src/components/LogoMarquee.jsx
import React from 'react';
import { motion } from 'framer-motion';

const LogoMarquee = ({
  logos = [
    { name: 'Vercel', src: 'https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png' },
    { name: 'Stripe', src: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Stripe_Logo%2C_revised_2016.svg' },
    { name: 'GitHub', src: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' },
    { name: 'Notion', src: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg' },
    { name: 'Figma', src: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg' },
    { name: 'Netlify', src: 'https://www.netlify.com/v3/static/favicon/apple-touch-icon.png' },
  ],
  fade = true,
  speed = 25,
  grayscale = true,
  size = 32,
  invertDark = false
}) => {
  const sequence = [...logos, ...logos];
  
  return (
    <div className="relative overflow-hidden py-6">
      {/* Enhanced fade masks */}
      {fade && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-10" />
        </>
      )}
      
      {/* Marquee container */}
      <div 
        className="flex gap-12 items-center"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          width: 'calc(200% + 12rem)'
        }}
      >
        {sequence.map((item, i) => (
          <motion.div
            key={`${item.name}-${i}`}
            className="flex-shrink-0"
            initial={{ opacity: 0.8, scale: 0.9 }}
            animate={{ opacity: 0.8, scale: 1 }}
            whileHover={{ 
              opacity: 1, 
              scale: 1.1,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <div className="group relative">
              {/* Enhanced background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125" />
              
              {/* Enhanced logo container */}
              <div className="relative flex items-center justify-center p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-300/50 dark:border-gray-600/50 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/30">
                <img
                  src={item.src}
                  alt={item.name}
                  className={`object-contain transition-all duration-300 ${invertDark ? 'dark:invert' : ''} ${grayscale ? 'opacity-80 group-hover:opacity-100' : 'opacity-90 group-hover:opacity-100'}`}
                  style={{ 
                    height: size, 
                    maxHeight: size, 
                    maxWidth: size * 1.5,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
                  }}
                  loading="lazy"
                />
              </div>
              
              {/* Enhanced tooltip on hover */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                  {item.name}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Custom CSS */}
      <style jsx={"true"}>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default LogoMarquee;
