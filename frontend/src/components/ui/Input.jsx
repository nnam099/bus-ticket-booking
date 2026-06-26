import React from 'react';

export default function Input({ label, error, className = '', containerClassName = '', icon, ...props }) {
  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 tracking-wide">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input 
          className={`w-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl ${icon ? 'pl-11' : 'px-4'} py-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#e85d04]/50 focus:border-[#e85d04] focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 placeholder-gray-400 ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-1.5 font-medium">{error}</span>}
    </div>
  );
}
