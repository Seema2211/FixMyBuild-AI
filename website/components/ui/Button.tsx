'use client';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, href, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070f] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

    const variants = {
      primary:
        'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 hover:-translate-y-0.5',
      ghost: 'text-slate-300 hover:text-white hover:bg-white/8',
      outline:
        'border border-white/15 text-slate-200 hover:border-indigo-500/50 hover:text-white hover:bg-white/5',
    };

    const sizes = {
      sm: 'h-8 px-4 text-sm gap-1.5',
      md: 'h-10 px-5 text-sm gap-2',
      lg: 'h-12 px-7 text-base gap-2',
    };

    const cls = cn(base, variants[variant], sizes[size], className);

    if (href) {
      return (
        <a href={href} className={cls}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} className={cls} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
