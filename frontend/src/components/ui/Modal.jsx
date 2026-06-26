import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 page-enter">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-800`}>
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur z-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 dark:hover:text-gray-300 transition-colors"
          >
            <i className="ti ti-x text-lg"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex justify-end gap-3 sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
