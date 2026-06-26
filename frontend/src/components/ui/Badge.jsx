import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
    primary: 'bg-orange-50 text-[#e85d04] border border-orange-100 dark:bg-[#e85d04]/10 dark:border-[#e85d04]/20',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
