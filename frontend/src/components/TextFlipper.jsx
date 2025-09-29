// src/components/TextFlipper.jsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const TextFlipper = ({
  words = ['Create', 'Share', 'Inspire', 'Discover'],
  interval = 2000,
  className = ''
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [interval, words.length]);

  return (
    <div className={`inline-block relative h-[1.2em] overflow-hidden align-baseline ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: '100%', rotateX: 90, opacity: 0 }}
          animate={{ y: 0, rotateX: 0, opacity: 1 }}
          exit={{ y: '-100%', rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default TextFlipper;
