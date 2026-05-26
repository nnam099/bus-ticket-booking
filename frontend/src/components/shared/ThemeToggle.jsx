import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-brand hover:text-brand ${
        compact ? 'h-9 w-9 px-0' : 'px-4 py-2'
      }`}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      {!compact && <span>{isDark ? 'Sáng' : 'Tối'}</span>}
    </button>
  );
}
