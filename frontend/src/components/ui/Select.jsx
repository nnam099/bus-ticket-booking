import React from 'react';

export default function Select({ label, error, className = '', containerClassName = '', options = [], ...props }) {
  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 tracking-wide">{label}</label>}
      <div className="relative">
        <select 
          className={`w-full appearance-none bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#e85d04]/50 focus:border-[#e85d04] focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''} ${className}`}
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
      {error && <span className="text-xs text-red-500 mt-1.5 font-medium">{error}</span>}
    </div>
  );
}
