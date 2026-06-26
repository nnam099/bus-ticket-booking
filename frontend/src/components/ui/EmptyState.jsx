import React from 'react';
import Card from './Card';

export default function EmptyState({ icon = 'ti-inbox', title = 'Không có dữ liệu', description = 'Chưa có thông tin nào được hiển thị.', action }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 bg-transparent shadow-none dark:bg-transparent">
      <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <i className={`ti ${icon} text-3xl text-gray-400 dark:text-gray-500`}></i>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </Card>
  );
}
