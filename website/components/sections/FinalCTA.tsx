'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Large glowing orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[400px] bg-indigo-600/15 dark:bg-indigo-600/20 rounded-full blur-[100px]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[200px] bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-[60px]" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Top + bottom beam borders */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-8 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Get started today
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 text-slate-900 dark:text-white">
            Stop debugging.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Start shipping.
            </span>
          </h2>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            FixMyBuild catches your CI/CD failures, explains them in plain English,
            and fixes them — automatically. Your team ships faster. Your pipelines stay green.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.fixmybuild.io/register"
              className="btn-glow inline-flex items-center justify-center gap-2 h-14 px-8 text-lg font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Start free — no credit card
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="mailto:sales@fixmybuild.io"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 text-lg font-semibold rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-white/5 dark:hover:bg-white/5 hover:border-indigo-400/40 transition-all duration-200 backdrop-blur-sm"
            >
              <Mail className="w-5 h-5" />
              Talk to us
            </a>
          </div>

          <p className="mt-8 text-sm text-slate-400 dark:text-slate-600">
            Free plan available · 14-day Pro trial · No credit card required
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[
              { label: 'SOC 2 Ready', icon: '🔒' },
              { label: 'GDPR Compliant', icon: '🇪🇺' },
              { label: '99.9% Uptime', icon: '⚡' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
