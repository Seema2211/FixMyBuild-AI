'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PLANS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Pricing</div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Simple,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              transparent
            </span>{' '}
            pricing
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Start free. Upgrade when your team grows.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                !annual ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                annual ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              Annual
              <span className="text-xs text-emerald-400 font-semibold">Save 20%</span>
            </button>
          </div>
        </motion.div>

        {/* Plan cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                'relative rounded-2xl p-7 flex flex-col',
                plan.popular
                  ? 'bg-gradient-to-b from-indigo-950/80 to-purple-950/60 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-900/30'
                  : 'bg-white/3 border border-white/10'
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    <Zap className="w-3 h-3 fill-white" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-5">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-white">
                    ${annual ? plan.priceAnnual : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-400 mb-2">/mo</span>
                  )}
                </div>
                {plan.price === 0 && (
                  <span className="text-slate-500 text-sm">Free forever</span>
                )}
                {plan.price > 0 && annual && (
                  <span className="text-xs text-emerald-400 font-medium">
                    Billed annually · Save ${(plan.price - plan.priceAnnual) * 12}/yr
                  </span>
                )}
              </div>

              {/* CTA */}
              <Button
                href={plan.ctaHref}
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full mb-7"
              >
                {plan.cta}
              </Button>

              {/* Feature list */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-slate-500 mt-8"
        >
          All plans include a 14-day free trial of Pro features. No credit card required to start.
        </motion.p>
      </div>
    </section>
  );
}
