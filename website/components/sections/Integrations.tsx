'use client';
import { motion } from 'framer-motion';

const INTEGRATION_ITEMS = [
  { name: 'GitHub Actions',     emoji: '⚡', color: 'from-slate-700 to-slate-600',    glow: 'rgba(100,116,139,0.4)' },
  { name: 'GitLab CI',          emoji: '🦊', color: 'from-orange-600 to-orange-500',  glow: 'rgba(234,88,12,0.4)' },
  { name: 'Azure Pipelines',    emoji: '☁️',  color: 'from-blue-600 to-blue-500',     glow: 'rgba(37,99,235,0.4)' },
  { name: 'Bitbucket Pipelines',emoji: '🪣', color: 'from-indigo-600 to-indigo-500',  glow: 'rgba(99,102,241,0.4)' },
  { name: 'Slack',              emoji: '💬', color: 'from-violet-600 to-purple-600',   glow: 'rgba(124,58,237,0.4)' },
  { name: 'Email',              emoji: '📧', color: 'from-emerald-600 to-teal-600',    glow: 'rgba(5,150,105,0.4)' },
  { name: 'Webhooks',           emoji: '🔗', color: 'from-cyan-600 to-cyan-500',       glow: 'rgba(8,145,178,0.4)' },
  { name: 'REST API',           emoji: '🛠', color: 'from-rose-600 to-pink-600',       glow: 'rgba(225,29,72,0.4)' },
];

function IntegrationPill({ name, emoji, color, glow }: { name: string; emoji: string; color: string; glow: string }) {
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl whitespace-nowrap hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-sm dark:shadow-none cursor-default">
      <div
        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-sm shrink-0 shadow-md`}
        style={{ boxShadow: `0 4px 12px ${glow}` }}
      >
        {emoji}
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
        {name}
      </span>
    </div>
  );
}

function MarqueeRow({ items, reverse = false }: { items: typeof INTEGRATION_ITEMS; reverse?: boolean }) {
  const doubled = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className="flex gap-3 w-max"
        style={{
          animation: `marquee ${reverse ? '28s' : '22s'} linear infinite ${reverse ? 'reverse' : ''}`,
        }}
      >
        {doubled.map((item, i) => (
          <IntegrationPill key={i} {...item} />
        ))}
      </div>
    </div>
  );
}

export function Integrations() {
  return (
    <section id="integrations" className="py-14 sm:py-24 lg:py-32 overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-500/[0.04] dark:bg-indigo-600/[0.06] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-widest">
            Integrations
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Works where your team{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              already works
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Connect via OAuth in under 2 minutes. No YAML configuration, no agents, no infrastructure changes.
          </p>
        </motion.div>
      </div>

      {/* Marquee rows */}
      <div className="space-y-4 mb-10 sm:mb-16">
        {[false, true].map((rev, ri) => (
          <div key={ri} className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />
            <MarqueeRow items={rev ? [...INTEGRATION_ITEMS].reverse() : INTEGRATION_ITEMS} reverse={rev} />
          </div>
        ))}
      </div>

      {/* Summary cards */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            { label: '4 CI/CD providers',   sub: 'GitHub · GitLab · Azure · Bitbucket', emoji: '🔌' },
            { label: 'OAuth in 2 minutes',  sub: 'No YAML, no agents, no infra changes', emoji: '⚡' },
            { label: 'Any system via API',  sub: 'REST ingest API with API key auth',    emoji: '🛠' },
          ].map((item) => (
            <div
              key={item.label}
              className="p-px rounded-2xl bg-gradient-to-br from-white/12 via-white/5 to-transparent hover:from-indigo-500/25 hover:via-purple-500/12 hover:to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent dark:hover:from-indigo-500/25 dark:hover:via-purple-500/12 dark:hover:to-transparent from-slate-200 hover:from-indigo-300/50 transition-all duration-500"
            >
              <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/90 px-6 py-5 text-center">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="font-bold text-slate-900 dark:text-white mb-1">{item.label}</div>
                <div className="text-sm text-slate-500 dark:text-slate-500">{item.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
