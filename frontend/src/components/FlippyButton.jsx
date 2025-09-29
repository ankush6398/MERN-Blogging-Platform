// src/components/FlippyButton.jsx
import React from 'react';

const FlippyButton = ({
  children = 'Get Started',
  onClick,
  className = '',
  variant = 'primary'
}) => {
  const palette = {
    primary: 'from-purple-600 via-pink-500 to-orange-400',
    blue: 'from-blue-600 via-indigo-500 to-cyan-400',
    green: 'from-emerald-600 via-lime-500 to-yellow-400'
  };

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center px-6 py-3 font-semibold text-white rounded-xl overflow-hidden group ${className}`}
    >
      {/* Glow */}
      <span className={`absolute inset-0 bg-gradient-to-r ${palette[variant] || palette.primary} opacity-80 transition-opacity group-hover:opacity-100`} />
      {/* Flip wrapper */}
      <span className="relative perspective-800">
        <span className="inline-block transition-transform duration-300 [transform-style:preserve-3d] group-hover:[transform:rotateX(90deg)]">
          <span className="block [backface-visibility:hidden]">{children}</span>
          <span className="block absolute left-0 top-0 [transform:rotateX(-90deg)] [transform-origin:50%_0]">🚀 Let’s Go</span>
        </span>
      </span>
      {/* Shine effect */}
      <span className="pointer-events-none absolute -inset-10 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700">
        <span className="block h-20 w-20 rotate-45 bg-white/25 blur-2xl" />
      </span>
    </button>
  );
};

export default FlippyButton;
