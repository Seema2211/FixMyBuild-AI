'use client';
import { motion } from 'framer-motion';
import { Link2, BrainCircuit, GitPullRequest, Sparkles } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect your repos',
    description:
      'Link GitHub, GitLab, Azure DevOps, or Bitbucket via OAuth. Select which repositories FixMyBuild should monitor. Done in under 2 minutes — no YAML, no agents, no infra changes.',
    accent: 'from-indigo-600 to-indigo-500',
    glowColor: 'rgba(99,102,241,0.4)',
    visual: (
      <div className="flex flex-wrap gap-2 mt-4">
        {['GitHub', 'GitLab', 'Azure DevOps', 'Bitbucket'].map((p) => (
          <span
            key={p}
            className="px-2.5 py-1 text-xs font-medium bg-white/8 dark:bg-white/8 bg-slate-100 border border-white/12 dark:border-white/12 border-slate-200 rounded-lg text-slate-300 dark:text-slate-300 text-slate-600"
          >
            {p}
          </span>
        ))}
      </div>
    ),
  },
  {
    number: '02',
    icon: BrainCircuit,
    title: 'AI analyzes the failure',
    description:
      'The moment a pipeline fails, FixMyBuild receives the event, reads the logs, and uses AI to identify the exact root cause — classified by severity with a plain-English explanation.',
    accent: 'from-purple-600 to-purple-500',
    glowColor: 'rgba(168,85,247,0.4)',
    visual: (
      <div className="mt-4 rounded-xl bg-white/4 dark:bg-white/4 bg-slate-50 border border-white/8 dark:border-white/8 border-slate-200 p-3 font-mono text-xs space-y-1.5">
        <div className="text-red-400">✗ Step "test" failed after 43s</div>
        <div className="text-indigo-400">→ Root cause: Missing env var NODE_ENV</div>
        <div className="text-emerald-400">→ Confidence: 94% · Severity: High</div>
      </div>
    ),
  },
  {
    number: '03',
    icon: GitPullRequest,
    title: 'Fix shipped automatically',
    description:
      'When AI confidence is ≥ 70%, FixMyBuild opens a pull request with the fix already applied. You review, approve, and merge. Your repo goes green.',
    accent: 'from-emerald-600 to-teal-500',
    glowColor: 'rgba(16,185,129,0.4)',
    visual: (
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-3 py-2.5">
        <GitPullRequest className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <div className="text-xs font-semibold text-emerald-300">PR #142 opened</div>
          <div className="text-xs text-slate-500">fix: add NODE_ENV to CI environment</div>
        </div>
        <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
          Open
        </span>
      </div>
    ),
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'It gets smarter over time',
    description:
      'Every merged or closed PR is tracked. FixMyBuild fingerprints recurring failure patterns and injects proven fixes into future analyses — automatically raising confidence on repeat failures.',
    accent: 'from-amber-600 to-orange-500',
    glowColor: 'rgba(245,158,11,0.4)',
    visual: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/8 border border-amber-500/20 px-3 py-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-amber-300">Pattern matched — 7 occurrences</div>
            <div className="text-xs text-slate-500">acceptance rate 87% · confidence ↑ 96%</div>
          </div>
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-14 sm:py-24 lg:py-32 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/[0.04] dark:bg-purple-600/[0.06] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-widest">
            How it works
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            From failure to fix in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              minutes
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            No manual debugging. No Slack threads. No senior engineer rabbit holes.
            Just automated analysis and a PR ready to merge.
          </p>
        </motion.div>

        {/* Steps grid with connector */}
        <div className="relative grid lg:grid-cols-4 gap-5 lg:gap-6">
          {/* Glowing connector line between steps */}
          <div className="hidden lg:block absolute top-16 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-px z-0">
            <div className="w-full h-full bg-gradient-to-r from-indigo-500/60 via-purple-500/60 via-emerald-500/60 to-amber-500/60" />
            <div className="absolute inset-0 blur-sm bg-gradient-to-r from-indigo-500/40 via-purple-500/40 via-emerald-500/40 to-amber-500/40" />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative z-10"
            >
              {/* Gradient border card */}
              <div className="p-px rounded-2xl bg-gradient-to-br from-white/12 via-white/5 to-transparent hover:from-indigo-500/30 hover:via-purple-500/15 hover:to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent dark:hover:from-indigo-500/30 dark:hover:via-purple-500/15 dark:hover:to-transparent from-slate-200 hover:from-indigo-300/50 transition-all duration-500">
                <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/90 backdrop-blur-sm p-6 h-full">
                  {/* Numbered glow ring */}
                  <div className="relative w-12 h-12 mx-auto lg:mx-0 mb-6">
                    <div
                      className="absolute inset-0 rounded-full blur-lg"
                      style={{ background: step.glowColor }}
                    />
                    <div
                      className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${step.accent} flex items-center justify-center font-bold text-white shadow-lg`}
                      style={{ boxShadow: `0 8px 20px ${step.glowColor}` }}
                    >
                      {step.number}
                    </div>
                  </div>

                  <div className="text-center lg:text-left">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                    {step.visual}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
