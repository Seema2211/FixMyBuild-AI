'use client';
import { motion } from 'framer-motion';
import { ArrowRight, GitPullRequest, BrainCircuit, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ProductMockup() {
  return (
    <div style={{ perspective: '1200px' }} className="relative">
      {/* Main mockup card */}
      <motion.div
        initial={{ opacity: 0, rotateY: -20, rotateX: 8 }}
        animate={{ opacity: 1, rotateY: 0, rotateX: 0 }}
        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transform: 'rotateY(-8deg) rotateX(3deg)', transformStyle: 'preserve-3d' }}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d1a] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111122] border-b border-white/[0.08]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 mx-3 h-5 rounded bg-white/[0.06] flex items-center px-3">
            <span className="text-[10px] text-slate-500 font-mono">app.fixmybuild.io</span>
          </div>
        </div>

        {/* App top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a18] border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">F</span>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="text-white font-medium">Dashboard</span>
              <span className="text-slate-600">Analytics</span>
              <span className="text-slate-600">Config</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/[0.12] border border-emerald-500/25 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-[#08080f] border-b border-white/[0.06]">
          {[
            { label: 'Failures',     value: '247', trend: '+12',  color: 'text-red-400' },
            { label: 'AI Confidence',value: '89%',  trend: '+3%', color: 'text-indigo-400' },
            { label: 'PRs Created',  value: '31',   trend: '+5',  color: 'text-purple-400' },
            { label: 'Resolved',     value: '94%',  trend: '+2%', color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2">
              <div className="text-[9px] text-slate-600 mb-1">{s.label}</div>
              <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-emerald-500">{s.trend}</div>
            </div>
          ))}
        </div>

        {/* Failure list */}
        <div className="p-3 space-y-1.5">
          {[
            { repo: 'acme/api',      pipeline: 'build & test', sev: 'High',   conf: 94, pr: true },
            { repo: 'acme/frontend', pipeline: 'deploy-prod',  sev: 'Medium', conf: 78, pr: false },
            { repo: 'acme/workers',  pipeline: 'unit-tests',   sev: 'Low',    conf: 91, pr: true },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-2 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                row.sev === 'High' ? 'bg-red-400' : row.sev === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{row.repo}</div>
                <div className="text-slate-600">{row.pipeline}</div>
              </div>
              <div className="text-slate-500">{row.conf}%</div>
              {row.pr && (
                <span className="bg-emerald-500/[0.12] border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded-full">
                  PR Open
                </span>
              )}
            </div>
          ))}

          {/* AI analysis panel */}
          <div className="mt-2 bg-indigo-500/[0.06] border border-indigo-500/20 rounded-lg p-2.5">
            <div className="text-[9px] text-indigo-400 font-medium mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              AI Analysis · acme/api
            </div>
            <div className="text-[9px] text-slate-400">
              Root cause: <span className="text-white">Missing NODE_ENV in CI environment variables</span>
            </div>
            <div className="text-[9px] text-emerald-400 mt-1">
              → Fix applied in PR #142 · 94% confidence
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badge: PR opened */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-6 bg-white/[0.08] dark:bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl z-10"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <div className="text-[10px] text-white font-semibold">PR #142 opened</div>
          <div className="text-[9px] text-slate-400">2 min ago</div>
        </div>
      </motion.div>

      {/* Floating badge: AI confidence */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-4 -left-8 bg-white/[0.08] dark:bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl z-10"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div>
          <div className="text-[10px] text-white font-semibold">94% confidence</div>
          <div className="text-[9px] text-slate-400">Root cause found</div>
        </div>
      </motion.div>
    </div>
  );
}

const AVATAR_COLORS = [
  'from-indigo-600 to-purple-600',
  'from-emerald-600 to-teal-600',
  'from-rose-600 to-pink-600',
  'from-amber-600 to-orange-600',
];

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden aurora-bg noise pt-16">
      {/* Large radial gradient spots */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-indigo-600/12 dark:bg-indigo-600/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Top beam line */}
      <div className="absolute top-16 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* ── Left — copy ─────────────────────────────────────────── */}
        <div>
          {/* Eyebrow badge with animated glow ring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative inline-flex items-center">
              {/* Animated glow ring */}
              <span className="ring-pulse absolute -inset-1 rounded-full bg-indigo-500/20 blur-sm" />
              <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm text-xs font-semibold text-indigo-300 dark:text-indigo-300 text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AI-Powered CI/CD Analysis
                <span className="text-indigo-500 dark:text-indigo-500">✦</span>
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-[68px] font-extrabold leading-[1.06] tracking-tight mb-4"
          >
            <span className="text-slate-900 dark:text-white">Stop losing hours</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-400 dark:from-red-400 dark:via-orange-400 dark:to-red-300">
              to broken pipelines.
            </span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="text-xl sm:text-2xl font-medium text-slate-500 dark:text-slate-400 mb-6 leading-snug"
          >
            FixMyBuild fixes them{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              — automatically.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10 max-w-xl"
          >
            FixMyBuild watches every CI/CD run across GitHub, GitLab, and Azure DevOps.
            When something breaks, AI analyzes the root cause and opens a pull request
            with the fix — before your team even notices.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="flex flex-col sm:flex-row gap-3 mb-12"
          >
            <a
              href="https://app.fixmybuild.io/register"
              className="btn-glow inline-flex items-center justify-center gap-2 h-12 px-7 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Start free — no credit card
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 text-base font-semibold rounded-xl border border-white/15 dark:border-white/15 border-slate-300 text-slate-700 dark:text-slate-200 hover:bg-white/5 dark:hover:bg-white/5 hover:border-indigo-400/40 transition-all duration-200 backdrop-blur-sm"
            >
              See how it works
            </a>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-4"
          >
            {/* Avatars */}
            <div className="flex -space-x-2">
              {AVATAR_COLORS.map((color, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} border-2 border-[var(--background)] flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Join 500+ teams</div>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-xs text-slate-500 dark:text-slate-500 ml-1">5.0 rating</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Right — Product mockup ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden lg:block"
        >
          {/* Glow behind mockup */}
          <div className="absolute -inset-8 bg-indigo-500/8 dark:bg-indigo-600/12 rounded-3xl blur-3xl pointer-events-none" />
          <ProductMockup />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none z-10" />
    </section>
  );
}
