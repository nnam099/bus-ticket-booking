import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-gray-100/50 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md ${className}`}>
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100/50 dark:border-slate-800 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
      {children}
    </thead>
  );
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-gray-50/50 dark:divide-slate-800/50">{children}</tbody>;
}

export function Tr({ children, className = '' }) {
  return <tr className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors ${className}`}>{children}</tr>;
}

export function Th({ children, className = '' }) {
  return <th className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</th>;
}

export function Td({ children, className = '' }) {
  return <td className={`px-6 py-4 text-sm text-gray-700 dark:text-gray-300 ${className}`}>{children}</td>;
}
