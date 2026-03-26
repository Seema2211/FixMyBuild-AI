'use client';
import { motion } from 'framer-motion';

const ALL_ITEMS = [
  'GitHub Actions', 'GitLab CI', 'Azure Pipelines', 'Bitbucket Pipelines',
  'Slack', 'Email', 'Webhooks', 'REST API',
];

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden">
      <div className="flex gap-3 w-max" style={{ animation: `marquee ${reverse ? '25s' : '20s'} linear infinite ${reverse ? 'reverse' : ''}` }}>
        {doubled.map((item, i) => (
          <div key={i} className="px-5 py-3 bg-white dark:bg-white/4 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap shadow-sm dark:shadow-none hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-white transition-colors">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Integrations() {
  return (
    <section id="integrations" className="py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">Integrations</div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Works where your team{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">already works</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Connect via OAuth in under 2 minutes. No YAML configuration, no agents, no infrastructure changes.
          </p>
        </motion.div>
      </div>

      <div className="space-y-4 mb-16">
        {[false, true].map((rev, ri) => (
          <div key={ri} className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />
            <MarqueeRow items={rev ? [...ALL_ITEMS].reverse() : ALL_ITEMS} reverse={rev} />
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid sm:grid-cols-3 gap-4 text-center">
          {[
            { label: '4 CI/CD providers', sub: 'GitHub · GitLab · Azure · Bitbucket' },
            { label: 'OAuth in 2 minutes', sub: 'No YAML, no agents, no infra changes' },
            { label: 'Any system via API', sub: 'REST ingest API with API key auth' },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-2xl px-6 py-5 shadow-sm dark:shadow-none">
              <div className="font-bold text-slate-900 dark:text-white mb-1">{item.label}</div>
              <div className="text-sm text-slate-500 dark:text-slate-500">{item.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
