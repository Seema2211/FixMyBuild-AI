'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FAQ as FAQ_DATA } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">FAQ</div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Common{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">questions</span>
          </h2>
        </motion.div>

        <div className="space-y-2">
          {FAQ_DATA.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={cn(
                  'w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-start gap-4',
                  open === i
                    ? 'bg-indigo-50 dark:bg-white/6 border-indigo-300 dark:border-indigo-500/30'
                    : 'bg-white dark:bg-white/3 border-slate-200 dark:border-white/8 hover:border-indigo-300 dark:hover:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5'
                )}
              >
                <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{item.q}</span>
                <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200', open === i && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
