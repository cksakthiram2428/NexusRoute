import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabels = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center p-0.5 rounded-full bg-white/80 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs cursor-pointer transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 ${className}`}
    >
      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
          !isDark
            ? 'bg-amber-100 text-amber-700 shadow-xs scale-100 rotate-0'
            : 'text-slate-400 hover:text-slate-200 scale-90 -rotate-12'
        }`}
      >
        <Sun className="w-3.5 h-3.5 transition-transform duration-300" />
      </span>

      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
          isDark
            ? 'bg-indigo-600 text-white shadow-xs scale-100 rotate-0'
            : 'text-slate-400 hover:text-slate-600 scale-90 rotate-12'
        }`}
      >
        <Moon className="w-3.5 h-3.5 transition-transform duration-300" />
      </span>

      {showLabels && (
        <span className="text-[11px] font-mono font-medium px-2 text-slate-700 dark:text-slate-200 select-none">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
