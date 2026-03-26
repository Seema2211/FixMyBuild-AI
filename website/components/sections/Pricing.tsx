'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PLANS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-400/4 dark:bg-indigo-600/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">Pricing</div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Simple,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">transparent</span>{' '}
            pricing
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">Start free. Upgrade when your team grows.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1">
            {[false, true].map((isAnnual) => (
              <button
                key={String(isAnnual)}
                onClick={() => setAnnual(isAnnual)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  annual === isAnnual
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                )}
              >
                {isAnnual ? 'Annual' : 'Monthly'}
                {isAnnual && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Save 20%</span>}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                'relative rounded-2xl p-7 flex flex-col transition-all duration-200',
                plan.popular
                  ? 'bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-indigo-950/80 dark:to-purple-950/60 border-2 border-indigo-400 dark:border-indigo-500/50 shadow-2xl shadow-indigo-100 dark:shadow-indigo-900/30'
                  : 'bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/20 hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    <Zap className="w-3 h-3 fill-white" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                    ${annual ? plan.priceAnnual : plan.price}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500 dark:text-slate-400 mb-2">/mo</span>}
                </div>
                {plan.price === 0 && <span className="text-slate-500 text-sm">Free forever</span>}
                {plan.price > 0 && annual && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Billed annually · Save ${(plan.price - plan.priceAnnual) * 12}/yr
                  </span>
                )}
              </div>

              <Button href={plan.ctaHref} variant={plan.popular ? 'primary' : 'outline'} className="w-full mb-7">
                {plan.cta}
              </Button>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center text-sm text-slate-500 dark:text-slate-500 mt-8">
          All plans include a 14-day free trial of Pro features. No credit card required to start.
        </motion.p>
      </div>
    </section>
  );
}
