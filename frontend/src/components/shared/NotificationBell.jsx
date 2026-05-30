import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../services/api';

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 10 });
      setItems(res.data.data.items || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) loadNotifications();
  };

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.readAt) {
        await notificationAPI.markRead(notification.id);
        setUnreadCount(count => Math.max(count - 1, 0));
        setItems(prev => prev.map(item => (
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
        )));
      }
    } catch {
      // Keep navigation usable even if marking read fails.
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setItems(prev => prev.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    } catch {
      // No visible state change needed on failure.
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-600 shadow-sm transition hover:border-brand hover:text-brand"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="font-bold text-gray-900">Thông báo</p>
              <p className="text-xs text-gray-500">{unreadCount} thông báo chưa đọc</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Đang tải thông báo...</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Bạn chưa có thông báo nào.</div>
            ) : (
              items.map(notification => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpenNotification(notification)}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-orange-50 ${
                    notification.readAt ? 'bg-white' : 'bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? 'bg-gray-200' : 'bg-brand'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-gray-900">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">{notification.message}</p>
                      <p className="mt-2 text-[11px] font-medium text-gray-400">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">
            <Link to="/my-tickets" onClick={() => setOpen(false)} className="text-xs font-semibold text-gray-600 hover:text-brand">
              Xem vé của tôi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
