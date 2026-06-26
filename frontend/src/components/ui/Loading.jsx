import React from 'react';

export default function Loading({ fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-[#e85d04]/20 border-t-[#e85d04] rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-gray-500 animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {content}
    </div>
  );
}
