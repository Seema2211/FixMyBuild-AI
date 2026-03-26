import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'purple' | 'green' | 'red' | 'yellow' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'indigo', className }: BadgeProps) {
  const variants = {
    indigo:  'bg-indigo-50  dark:bg-indigo-500/15  text-indigo-600  dark:text-indigo-300  border-indigo-200  dark:border-indigo-500/25',
    purple:  'bg-purple-50  dark:bg-purple-500/15  text-purple-600  dark:text-purple-300  border-purple-200  dark:border-purple-500/25',
    green:   'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25',
    red:     'bg-red-50     dark:bg-red-500/15     text-red-600     dark:text-red-300     border-red-200     dark:border-red-500/25',
    yellow:  'bg-amber-50   dark:bg-amber-500/15   text-amber-600   dark:text-amber-300   border-amber-200   dark:border-amber-500/25',
    neutral: 'bg-slate-100  dark:bg-white/8        text-slate-600   dark:text-slate-300   border-slate-200   dark:border-white/12',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}
