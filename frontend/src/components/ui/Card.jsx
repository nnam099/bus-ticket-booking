import React from 'react';

export default function Card({ children, className = '', noPadding = false, hover = false, ...props }) {
  return (
    <div 
      className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100/50 dark:border-slate-800 transition-all duration-300 relative overflow-hidden ${noPadding ? '' : 'p-6'} ${hover ? 'hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
