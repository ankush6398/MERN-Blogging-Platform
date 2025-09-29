// src/components/Reveal.jsx
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const Reveal = ({ children, delay = 0, y = 24, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
