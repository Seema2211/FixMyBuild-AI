'use client';
import { motion } from 'framer-motion';
import { Link2, BrainCircuit, GitPullRequest } from 'lucide-react';

const STEPS = [
  {
    number: '01', icon: Link2, title: 'Connect your repos',
    description: 'Link GitHub, GitLab, Azure DevOps, or Bitbucket via OAuth. Select which repositories FixMyBuild should monitor. Done in under 2 minutes — no YAML, no agents, no infra changes.',
    visual: (
      <div className="flex flex-wrap gap-2 mt-4">
        {['GitHub', 'GitLab', 'Azure DevOps', 'Bitbucket'].map((p) => (
          <span key={p} className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-white/8 border border-slate-200 dark:border-white/12 rounded-lg text-slate-600 dark:text-slate-300">
            {p}
          </span>
        ))}
      </div>
    ),
  },
  {
    number: '02', icon: BrainCircuit, title: 'AI analyzes the failure',
    description: 'The moment a pipeline fails, FixMyBuild receives the event, reads the logs, and uses AI to identify the exact root cause — classified by severity with a plain-English explanation.',
    visual: (
      <div className="mt-4 rounded-xl bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/8 p-3 font-mono text-xs space-y-1.5">
        <div className="text-red-500 dark:text-red-400">✗ Step "test" failed after 43s</div>
        <div className="text-indigo-600 dark:text-indigo-300">→ Root cause: Missing env var NODE_ENV</div>
        <div className="text-emerald-600 dark:text-emerald-400">→ Confidence: 94% · Severity: High</div>
      </div>
    ),
  },
  {
    number: '03', icon: GitPullRequest, title: 'Fix shipped automatically',
    description: 'When AI confidence is ≥ 70%, FixMyBuild opens a pull request with the fix already applied. You review, approve, and merge. Your repo goes green.',
    visual: (
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2.5">
        <GitPullRequest className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">PR #142 opened</div>
          <div className="text-xs text-slate-500 dark:text-slate-500">fix: add NODE_ENV to CI environment</div>
        </div>
        <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">Open</span>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">How it works</div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            From failure to fix in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">minutes</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            No manual debugging. No Slack threads. No senior engineer rabbit holes. Just automated analysis and a PR ready to merge.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-2xl p-6 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-none dark:hover:bg-white/5 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 group-hover:shadow-indigo-300 dark:group-hover:shadow-indigo-900/60 transition-shadow">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black text-slate-200 dark:text-white/10 group-hover:text-slate-300 dark:group-hover:text-white/15 transition-colors">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
              {step.visual}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
