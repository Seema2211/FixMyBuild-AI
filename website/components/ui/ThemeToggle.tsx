'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render nothing on server
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn('w-9 h-9 rounded-xl bg-transparent', className)} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
        'border border-[var(--border)] bg-[var(--surface)]',
        'hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        'text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400',
        className
      )}
    >
      <Sun
        className={cn(
          'w-4 h-4 absolute transition-all duration-300',
          isDark ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
        )}
      />
      <Moon
        className={cn(
          'w-4 h-4 absolute transition-all duration-300',
          isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
        )}
      />
    </button>
  );
}
