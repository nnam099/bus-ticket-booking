import React from 'react';

export default function Select({ label, error, className = '', containerClassName = '', options = [], ...props }) {
  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      {label && <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <div className="relative">
        <select 
          className={`w-full appearance-none bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all shadow-sm ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>
      {error && <span className="text-xs text-red-500 mt-1.5 font-medium">{error}</span>}
    </div>
  );
}
