'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FAQ as FAQ_DATA } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-14 sm:py-24 lg:py-32 relative">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/[0.03] dark:bg-indigo-600/[0.05] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-widest">
            FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Common{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              questions
            </span>
          </h2>
        </motion.div>

        <div className="space-y-2">
          {FAQ_DATA.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Gradient border wrapper */}
              <div className={cn(
                'p-px rounded-2xl transition-all duration-300',
                open === i
                  ? 'bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-transparent'
                  : 'bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:from-indigo-500/25 hover:via-purple-500/10 hover:to-transparent dark:from-white/8 dark:via-white/4 dark:to-transparent dark:hover:from-indigo-500/25 dark:hover:via-purple-500/10 dark:hover:to-transparent from-slate-200 hover:from-indigo-300/50'
              )}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className={cn(
                    'w-full text-left px-5 py-4 rounded-[15px] transition-all duration-200 flex items-start gap-4',
                    open === i
                      ? 'bg-indigo-50 dark:bg-[#0d0d1a]'
                      : 'bg-white dark:bg-[#0d0d1a]/90 hover:bg-slate-50 dark:hover:bg-[#0e0e1f]'
                  )}
                >
                  <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200',
                      open === i && 'rotate-180 text-indigo-400'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden bg-indigo-50 dark:bg-[#0d0d1a] rounded-b-[15px]"
                    >
                      <div className="px-5 pb-4 pt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-indigo-100 dark:border-white/[0.06]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
