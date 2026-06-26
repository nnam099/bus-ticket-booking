import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  icon,
  loading = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 outline-none select-none whitespace-nowrap cursor-pointer rounded-md';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'bg-transparent border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-sm',
    icon: 'p-2',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <i className="ti ti-loader animate-spin mr-2" />}
      {!loading && icon && <span className="mr-2 flex items-center">{icon}</span>}
      {children}
    </button>
  );
}
