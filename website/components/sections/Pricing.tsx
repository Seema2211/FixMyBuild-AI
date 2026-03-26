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
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-400/[0.04] dark:bg-indigo-600/[0.07] rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-widest">
            Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Simple,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              transparent
            </span>{' '}
            pricing
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Start free. Upgrade when your team grows.
          </p>

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
                {isAnnual && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Save 20%</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              {plan.popular ? (
                /* ── Popular card ── */
                <div className="relative h-full rounded-2xl p-px bg-gradient-to-b from-indigo-500/50 to-purple-500/20">
                  {/* Glow underneath */}
                  <div className="absolute -inset-4 bg-indigo-600/15 dark:bg-indigo-600/15 rounded-3xl blur-2xl -z-10" />

                  {/* Always dark navy — it's the featured card in both themes */}
                  <div className="rounded-[15px] bg-[#0c0b2e] p-7 flex flex-col h-full">
                    {/* Popular badge */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-900/40">
                        <Zap className="w-3 h-3 fill-white" />
                        Most Popular
                      </div>
                    </div>

                    <div className="mb-5">
                      <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-sm text-indigo-300">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-end gap-1">
                        <span className="text-5xl font-extrabold text-white">
                          ${annual ? plan.priceAnnual : plan.price}
                        </span>
                        <span className="text-indigo-300 mb-2">/mo</span>
                      </div>
                      {annual && (
                        <span className="text-xs text-emerald-400 font-medium">
                          Billed annually · Save ${(plan.price - plan.priceAnnual) * 12}/yr
                        </span>
                      )}
                    </div>

                    <a
                      href={plan.ctaHref}
                      className="btn-glow inline-flex items-center justify-center w-full h-10 px-5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-900/30 mb-7 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {plan.cta}
                    </a>

                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-slate-200">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* ── Regular card ── */
                <div className="p-px rounded-2xl h-full bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:from-indigo-500/25 hover:via-purple-500/10 hover:to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent dark:hover:from-indigo-500/25 dark:hover:via-purple-500/10 dark:hover:to-transparent from-slate-200 hover:from-indigo-300/50 transition-all duration-500">
                  <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/90 p-7 flex flex-col h-full">
                    <div className="mb-5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-end gap-1">
                        <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                          ${annual ? plan.priceAnnual : plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-slate-500 dark:text-slate-400 mb-2">/mo</span>
                        )}
                      </div>
                      {plan.price === 0 && (
                        <span className="text-slate-500 text-sm">Free forever</span>
                      )}
                      {plan.price > 0 && annual && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Billed annually · Save ${(plan.price - plan.priceAnnual) * 12}/yr
                        </span>
                      )}
                    </div>

                    <Button href={plan.ctaHref} variant="outline" className="w-full mb-7">
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
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-slate-500 dark:text-slate-500 mt-10"
        >
          All plans include a 14-day free trial of Pro features. No credit card required to start.
        </motion.p>
      </div>
    </section>
  );
}
