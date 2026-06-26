import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 outline-none select-none whitespace-nowrap cursor-pointer';
  
  const variants = {
    primary: 'bg-[#e85d04] text-white shadow-[0_4px_16px_rgba(232,93,4,0.35)] hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'bg-transparent border-[1.5px] border-[#f0e6d8] dark:border-slate-700 text-[#4a3b32] dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-full',
    lg: 'px-8 py-3 text-base rounded-full',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

  return (
    <button className={classes} disabled={disabled} {...props}>
      {icon && <span className="mr-2 flex items-center">{icon}</span>}
      {children}
    </button>
  );
}
