'use client';
import { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'How it works', href: '#how-it-works' },
];

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
          ? 'bg-[#07070f]/80 backdrop-blur-xl border-b border-white/8 shadow-xl shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:shadow-indigo-900/60 transition-shadow">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Fix<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">My</span>Build
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/6 transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" href="https://app.fixmybuild.io/login">
            Sign in
          </Button>
          <Button size="sm" href="https://app.fixmybuild.io/register">
            Start free →
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/8 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0c0c18]/95 backdrop-blur-xl border-b border-white/8 px-4 pb-5 pt-2">
          <div className="flex flex-col gap-1 mb-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/8 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-3 border-t border-white/8">
            <Button variant="outline" href="https://app.fixmybuild.io/login">Sign in</Button>
            <Button href="https://app.fixmybuild.io/register">Start free →</Button>
          </div>
        </div>
      )}
    </header>
  );
}
