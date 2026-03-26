'use client';
import { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-[#07070f]/85 backdrop-blur-xl border-b border-black/8 dark:border-white/8 shadow-sm dark:shadow-black/30'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-indigo-500/40 blur-md group-hover:bg-indigo-500/60 transition-all" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">
            Fix<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">My</span>Build
          </span>
        </a>

        {/* Desktop CTA + theme toggle */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" href="https://app.fixmybuild.io/login">
            Sign in
          </Button>
          <Button size="sm" href="https://app.fixmybuild.io/register">
            Start free →
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Scrolled bottom beam */}
        {scrolled && (
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        )}
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white/95 dark:bg-[#0c0c18]/95 backdrop-blur-xl border-b border-black/8 dark:border-white/8 px-4 pb-5 pt-2">
          <div className="flex flex-col gap-2 pt-3">
            <Button variant="outline" href="https://app.fixmybuild.io/login">Sign in</Button>
            <Button href="https://app.fixmybuild.io/register">Start free →</Button>
          </div>
        </div>
      )}
    </header>
  );
}
