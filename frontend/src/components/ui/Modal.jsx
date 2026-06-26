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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-[#0a0a0a] rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-white/10`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0a0a0a] z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <i className="ti ti-x text-lg"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex justify-end gap-3 sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
