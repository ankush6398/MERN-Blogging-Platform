// src/components/CounterStat.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const CounterStat = ({ end = 1000, suffix = '+', label = 'Users', duration = 1200 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [inView, end, duration]);

  return (
    <div ref={ref} className="text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
        {value}{suffix}
      </div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
};

export default CounterStat;
