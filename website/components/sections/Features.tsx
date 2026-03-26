'use client';
import { motion } from 'framer-motion';
import {
  BrainCircuit, GitPullRequest, AlertTriangle, BarChart3,
  Radio, Webhook, Bell, Key,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI Root-Cause Analysis',
    description:
      'Not just log dumps. FixMyBuild reads your failure, understands your stack, and tells you exactly what broke — and why — in under 3 seconds.',
    size: 'large',
    accent: 'from-indigo-600 to-indigo-500',
    preview: (
      <div className="mt-5 rounded-xl bg-black/30 border border-white/8 p-4 font-mono text-xs space-y-2">
        <div className="text-slate-500"># AI analysis</div>
        <div className="text-white">Root cause detected:</div>
        <div className="text-indigo-300 pl-2">→ NODE_ENV not set in CI environment</div>
        <div className="text-slate-400 pl-2">→ jest.config.js reads process.env.NODE_ENV</div>
        <div className="text-slate-400 pl-2">→ Falls back to undefined, breaks module resolver</div>
        <div className="mt-2 text-emerald-400">Confidence: 94% — Fix available</div>
      </div>
    ),
  },
  {
    icon: GitPullRequest,
    title: 'Auto-PR Creation',
    description:
      'When confidence ≥ 70%, FixMyBuild opens a pull request with the fix. You stay in flow. Your repo stays green.',
    size: 'medium',
    accent: 'from-purple-600 to-purple-500',
    preview: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
          <GitPullRequest className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">PR #142 — fix: add NODE_ENV</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
          <GitPullRequest className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">PR #137 — fix: pin eslint version</span>
        </div>
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    title: 'Severity Triage',
    description:
      'Every failure is classified — Critical, High, Medium, Low — so you fix what matters first.',
    size: 'small',
    accent: 'from-red-600 to-orange-500',
    preview: (
      <div className="mt-4 flex flex-col gap-1.5">
        {[
          { label: 'Critical', color: 'bg-red-500', w: 'w-11/12' },
          { label: 'High',     color: 'bg-orange-500', w: 'w-4/5' },
          { label: 'Medium',   color: 'bg-amber-500', w: 'w-3/5' },
          { label: 'Low',      color: 'bg-emerald-500', w: 'w-2/5' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-14">{s.label}</span>
            <div className="flex-1 bg-white/5 rounded-full h-2">
              <div className={`${s.color} ${s.w} h-2 rounded-full opacity-70`} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: 'Trend Analytics',
    description:
      'See which repos fail most. Track failure categories over time. Spot patterns before they become incidents.',
    size: 'medium',
    accent: 'from-cyan-600 to-indigo-500',
    preview: (
      <div className="mt-4 flex items-end gap-1.5 h-16">
        {[30, 55, 40, 70, 45, 80, 60, 90, 50, 75, 85, 65].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600 to-purple-500 opacity-70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Radio,
    title: 'Real-time Stream',
    description:
      'Server-sent events push analysis to your dashboard the moment it\'s ready. No polling, no delays.',
    size: 'small',
    accent: 'from-emerald-600 to-teal-500',
    preview: (
      <div className="mt-4 space-y-2">
        {['Listening for events…', '✓ build:failure received', '✓ AI analysis complete'].map((line, i) => (
          <div key={i} className={`text-xs font-mono ${i === 0 ? 'text-slate-500' : i === 2 ? 'text-emerald-400' : 'text-indigo-400'}`}>
            {line}
          </div>
        ))}
        <span className="inline-block w-1.5 h-3.5 bg-emerald-400 cursor-blink" />
      </div>
    ),
  },
  {
    icon: Webhook,
    title: 'Webhooks & Slack',
    description:
      'Push failure events to any system. Slack, PagerDuty, Linear — your workflow, your rules.',
    size: 'small',
    accent: 'from-violet-600 to-purple-500',
    preview: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">#dev-alerts  →  Slack</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-slate-300">POST https://hooks.example.com/</span>
        </div>
      </div>
    ),
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Email and Slack alerts for failures that match your severity threshold. No noise, just signal.',
    size: 'small',
    accent: 'from-amber-600 to-orange-500',
    preview: null,
  },
  {
    icon: Key,
    title: 'API-First Ingest',
    description:
      'Works with any CI system. One HTTP call with your API key and FixMyBuild handles the rest.',
    size: 'small',
    accent: 'from-slate-600 to-slate-500',
    preview: null,
  },
];

const sizeClasses: Record<string, string> = {
  large:  'lg:col-span-2 lg:row-span-2',
  medium: 'lg:col-span-2',
  small:  'lg:col-span-1',
};

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Features</div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Everything you need to stop{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              firefighting
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            From intelligent failure analysis to automatic pull requests — built for the way modern engineering teams work.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-auto">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className={`
                group relative bg-white/3 border border-white/8 rounded-2xl p-6
                hover:border-white/15 hover:bg-white/5 transition-all duration-300 cursor-default
                ${sizeClasses[feature.size]}
              `}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-4 shadow-lg group-hover:-translate-y-0.5 transition-transform`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>

              {feature.preview}

              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-[0.04] transition-opacity pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
