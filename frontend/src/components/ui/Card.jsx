import React from 'react';

export default function Card({ children, className = '', noPadding = false, hover = false, ...props }) {
  return (
    <div 
      className={`bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm transition-shadow duration-200 ${noPadding ? '' : 'p-6'} ${hover ? 'hover:shadow-md' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
