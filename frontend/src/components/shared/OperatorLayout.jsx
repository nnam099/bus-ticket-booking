import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

export default function OperatorLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { user } = useSelector(state => state.auth);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      dispatch(logout());
      navigate('/');
    }
  };

  const navGroups = [
    {
      label: 'Tổng quan',
      items: [
        { to: '/operator', label: 'Dashboard', icon: 'ti-layout-grid' },
        { to: '/operator/reports', label: 'Báo cáo', icon: 'ti-chart-bar' },
      ]
    },
    {
      label: 'Quản lý',
      items: [
        { to: '/operator/vehicles', label: 'Xe khách', icon: 'ti-car' },
        { to: '/operator/routes', label: 'Tuyến xe', icon: 'ti-map-route' },
        { to: '/operator/trips', label: 'Chuyến xe', icon: 'ti-calendar-event' },
        { to: '/operator/staffs', label: 'Nhân viên', icon: 'ti-users' },
      ]
    },
    {
      label: 'Cài đặt',
      items: [
        { to: '/operator/profile', label: 'Hồ sơ', icon: 'ti-user-circle' },
      ]
    }
  ];

  return (
    <div className={`min-h-screen w-full flex ${isDark ? 'bg-[#0a0a0a] text-slate-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Sidebar */}
      <aside 
        className={`shrink-0 flex flex-col border-r transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        } ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}
      >
        <div className={`h-14 flex items-center px-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 font-bold text-sm tracking-wide">
              <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center">
                <i className="ti ti-bus text-white dark:text-black text-sm" />
              </div>
              <span className="text-gray-900 dark:text-white">Operator<span className="text-gray-400 font-normal">Panel</span></span>
            </Link>
          )}
          {collapsed && (
            <Link to="/">
              <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center">
                <i className="ti ti-bus text-white dark:text-black text-sm" />
              </div>
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              {!collapsed && (
                <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                          : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.label : ''}
                    >
                      <i className={`ti ${item.icon} text-lg ${active ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`p-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {!collapsed && <div className="flex-1 px-2 text-xs font-medium text-gray-500 truncate">{user?.email}</div>}
            <div className={collapsed ? 'mx-auto' : ''}>
              <ThemeToggle />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Đăng xuất' : ''}
          >
            <i className="ti ti-logout text-lg text-gray-400" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className={`h-14 shrink-0 flex items-center justify-between px-6 border-b transition-colors ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <i className="ti ti-menu-2 text-xl" />
            </button>
            <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Nhà xe / <span className={isDark ? 'text-white' : 'text-gray-900'}>
                {navGroups.flatMap(g => g.items).find(i => i.to === location.pathname)?.label || 'Page'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user?.fullName?.charAt(0) || 'O'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8 page-enter">
          <div className="max-w-6xl mx-auto space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
