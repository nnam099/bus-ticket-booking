import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold">
      {children}
    </thead>
  );
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-gray-200 dark:divide-white/10">{children}</tbody>;
}

export function Tr({ children, className = '' }) {
  return <tr className={`hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors ${className}`}>{children}</tr>;
}

export function Th({ children, className = '' }) {
  return <th className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</th>;
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${className}`}>{children}</td>;
}
