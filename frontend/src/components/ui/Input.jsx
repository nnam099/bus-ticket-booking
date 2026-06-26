import React from 'react';

export default function Input({ label, error, className = '', containerClassName = '', icon, ...props }) {
  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      {label && <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {typeof icon === 'string' ? <i className={`ti ${icon} text-base`}></i> : icon}
          </div>
        )}
        <input 
          className={`w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-md ${icon ? 'pl-9' : 'px-3'} py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all shadow-sm placeholder-gray-400 ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-1.5 font-medium">{error}</span>}
    </div>
  );
}
