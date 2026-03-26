'use client';
import { motion } from 'framer-motion';
import { Sparkles, GitMerge, ThumbsUp, ThumbsDown, RefreshCw, ArrowRight } from 'lucide-react';

const LOOP_STEPS = [
  {
    icon: GitMerge,
    label: 'Fix PR opened',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: ThumbsUp,
    label: 'Outcome tracked',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Sparkles,
    label: 'Pattern learned',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: RefreshCw,
    label: 'Next failure: better',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
];

const EVIDENCE_CARDS = [
  {
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/20',
    iconBg: 'bg-gradient-to-br from-amber-600 to-orange-500',
    glowColor: 'rgba(245,158,11,0.3)',
    title: 'Fingerprint matched',
    body: (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-400">a3f2c1b8e9d07f4c</span>
          <span className="text-amber-400 font-semibold">×&thinsp;7</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            Based on 7 similar past failures
          </span>
        </div>
        <div className="text-[11px] text-slate-500">category: dependency</div>
      </div>
    ),
  },
  {
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
    iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-500',
    glowColor: 'rgba(16,185,129,0.3)',
    title: 'Acceptance rate',
    body: (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">fix success rate</span>
          <span className="text-emerald-400 font-bold">87%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="text-emerald-400">✓ 6 accepted</span>
          <span className="text-red-400">✗ 1 rejected</span>
        </div>
      </div>
    ),
  },
  {
    accent: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/20',
    iconBg: 'bg-gradient-to-br from-indigo-600 to-purple-500',
    glowColor: 'rgba(99,102,241,0.3)',
    title: 'Confidence boosted',
    body: (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-slate-500">1st occurrence</span>
            <span className="text-slate-300 font-bold text-base">72%</span>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-indigo-400">7th occurrence</span>
            <span className="text-indigo-300 font-bold text-base">96%</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">known fix injected into prompt</div>
      </div>
    ),
  },
];

export function SelfLearning() {
  return (
    <section id="self-learning" className="py-14 sm:py-24 lg:py-32 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-amber-500/[0.04] dark:bg-amber-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[300px] bg-indigo-500/[0.05] dark:bg-indigo-600/[0.07] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/8 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-4 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Pattern Intelligence
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            AI that gets smarter{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              with every fix
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Most AI tools give the same answer every time. FixMyBuild learns from your
            team&apos;s actual fix outcomes — so recurring failures get higher confidence
            and a proven solution, automatically.
          </p>
        </motion.div>

        {/* Learning loop */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-16 sm:mb-20"
        >
          {LOOP_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3">
              <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border ${step.bg}`}>
                <step.icon className={`w-4 h-4 ${step.color} shrink-0`} />
                <span className={`text-xs sm:text-sm font-semibold ${step.color}`}>{step.label}</span>
              </div>
              {i < LOOP_STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
              )}
            </div>
          ))}
          {/* Loop-back arrow hint */}
          <div className="w-full flex justify-center mt-1">
            <span className="text-xs text-slate-400 dark:text-slate-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> repeats on every future occurrence
            </span>
          </div>
        </motion.div>

        {/* Evidence cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {EVIDENCE_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className={`p-px rounded-2xl h-full bg-gradient-to-br ${card.accent}`}>
                <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/95 p-5 h-full">
                  <div
                    className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center mb-3 shadow-lg`}
                    style={{ boxShadow: `0 6px 20px ${card.glowColor}` }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  {card.body}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Plan differentiation callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg" style={{ boxShadow: '0 6px 20px rgba(245,158,11,0.35)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                Available on Pro &amp; Business
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Historical context injection is a Pro+ feature. Free plan users still receive
                full AI root-cause analysis — they just don&apos;t get the accumulated fix history.
              </p>
            </div>
            <a
              href="#pricing"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              See plans <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
