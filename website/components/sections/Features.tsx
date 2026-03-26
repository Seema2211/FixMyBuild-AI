'use client';
import { motion } from 'framer-motion';
import { BrainCircuit, GitPullRequest, AlertTriangle, BarChart3, Radio, Webhook, Bell, Key } from 'lucide-react';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI Root-Cause Analysis',
    size: 'large',
    accent: 'from-indigo-600 to-indigo-500',
    glowColor: 'rgba(99,102,241,0.35)',
    description:
      'Not just log dumps. FixMyBuild reads your failure, understands your stack, and tells you exactly what broke — and why — in under 3 seconds.',
    preview: (
      <div className="mt-5 rounded-xl bg-black/20 dark:bg-black/30 border border-white/6 dark:border-white/8 p-4 font-mono text-xs space-y-2">
        <div className="text-slate-500"># AI analysis</div>
        <div className="text-slate-200 dark:text-white">Root cause detected:</div>
        <div className="text-indigo-400 pl-2">→ NODE_ENV not set in CI environment</div>
        <div className="text-slate-500 pl-2">→ jest.config.js reads process.env.NODE_ENV</div>
        <div className="text-slate-500 pl-2">→ Falls back to undefined, breaks module resolver</div>
        <div className="mt-2 text-emerald-400">Confidence: 94% — Fix available</div>
      </div>
    ),
  },
  {
    icon: GitPullRequest,
    title: 'Auto-PR Creation',
    size: 'medium',
    accent: 'from-purple-600 to-purple-500',
    glowColor: 'rgba(168,85,247,0.35)',
    description:
      'When confidence ≥ 70%, FixMyBuild opens a pull request with the fix. You stay in flow. Your repo stays green.',
    preview: (
      <div className="mt-4 space-y-2">
        {['fix: add NODE_ENV', 'fix: pin eslint version'].map((msg, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">PR #{142 - i} — {msg}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    title: 'Severity Triage',
    size: 'small',
    accent: 'from-red-600 to-orange-500',
    glowColor: 'rgba(239,68,68,0.35)',
    description:
      'Every failure classified — Critical, High, Medium, Low — so you fix what matters first.',
    preview: (
      <div className="mt-4 flex flex-col gap-1.5">
        {[
          { label: 'Critical', w: '92%', color: 'bg-red-500' },
          { label: 'High',     w: '80%', color: 'bg-orange-500' },
          { label: 'Medium',   w: '60%', color: 'bg-amber-500' },
          { label: 'Low',      w: '40%', color: 'bg-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-14">{s.label}</span>
            <div className="flex-1 bg-white/5 rounded-full h-2">
              <div className={`${s.color} h-2 rounded-full opacity-70`} style={{ width: s.w }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: 'Trend Analytics',
    size: 'medium',
    accent: 'from-cyan-600 to-indigo-500',
    glowColor: 'rgba(6,182,212,0.3)',
    description:
      'See which repos fail most. Track failure categories over time. Spot patterns before they become incidents.',
    preview: (
      <div className="mt-4 flex items-end gap-1.5 h-16">
        {[30, 55, 40, 70, 45, 80, 60, 90, 50, 75, 85, 65].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600 to-purple-500 opacity-60 dark:opacity-70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Radio,
    title: 'Real-time Stream',
    size: 'small',
    accent: 'from-emerald-600 to-teal-500',
    glowColor: 'rgba(16,185,129,0.35)',
    description:
      "Server-sent events push analysis to your dashboard the moment it's ready. No polling, no delays.",
    preview: (
      <div className="mt-4 space-y-2">
        {[
          { text: 'Listening for events…', color: 'text-slate-500' },
          { text: '✓ build:failure received', color: 'text-indigo-400' },
          { text: '✓ AI analysis complete',  color: 'text-emerald-400' },
        ].map((line, i) => (
          <div key={i} className={`text-xs font-mono ${line.color}`}>{line.text}</div>
        ))}
        <span className="inline-block w-1.5 h-3.5 bg-emerald-400 cursor-blink" />
      </div>
    ),
  },
  {
    icon: Webhook,
    title: 'Webhooks & Slack',
    size: 'small',
    accent: 'from-violet-600 to-purple-500',
    glowColor: 'rgba(139,92,246,0.35)',
    description:
      'Push failure events to any system. Slack, PagerDuty, Linear — your workflow, your rules.',
    preview: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300">#dev-alerts → Slack</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-slate-300">POST https://hooks.example.com/</span>
        </div>
      </div>
    ),
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    size: 'small',
    accent: 'from-amber-600 to-orange-500',
    glowColor: 'rgba(245,158,11,0.35)',
    description:
      'Email and Slack alerts for failures that match your severity threshold. No noise, just signal.',
    preview: null,
  },
  {
    icon: Key,
    title: 'API-First Ingest',
    size: 'small',
    accent: 'from-slate-500 to-slate-400',
    glowColor: 'rgba(100,116,139,0.35)',
    description:
      'Works with any CI system. One HTTP call with your API key and FixMyBuild handles the rest.',
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
    <section id="features" className="py-24 lg:py-32 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/[0.04] dark:bg-indigo-600/[0.06] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-widest">
            Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Everything you need to stop{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              firefighting
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From intelligent failure analysis to automatic pull requests — built for the way modern engineering teams work.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-auto">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className={`group cursor-default ${sizeClasses[feature.size]}`}
            >
              {/* Gradient border wrapper */}
              <div className="p-px rounded-2xl h-full bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:from-indigo-500/40 hover:via-purple-500/20 hover:to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent dark:hover:from-indigo-500/40 dark:hover:via-purple-500/20 dark:hover:to-transparent from-slate-200 via-slate-100 hover:from-indigo-300/60 transition-all duration-500">
                <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/90 backdrop-blur-sm p-6 h-full flex flex-col">
                  {/* Icon with glow */}
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center shadow-lg mb-5 group-hover:-translate-y-0.5 transition-transform duration-300`}
                    style={{ boxShadow: `0 8px 24px ${feature.glowColor}` }}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                  {feature.preview && <div className="flex-1">{feature.preview}</div>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
