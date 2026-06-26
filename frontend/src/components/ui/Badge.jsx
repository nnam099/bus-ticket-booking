import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300',
    primary: 'bg-orange-50 text-[#e85d04] border border-orange-100 dark:bg-[#e85d04]/10 dark:border-[#e85d04]/20',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
