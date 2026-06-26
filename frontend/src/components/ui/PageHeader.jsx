import React from 'react';

export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white tracking-tight">{title}</h1>
        {description && <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{description}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
