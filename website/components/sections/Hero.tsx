'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, GitPullRequest, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// ── Terminal demo animation ────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { delay: 0,    text: '$ curl -X POST https://api.fixmybuild.io/api/ingest \\', color: 'text-slate-300' },
  { delay: 600,  text: '    -H "X-API-Key: fmb_live_•••••••••••••••" \\',        color: 'text-slate-400' },
  { delay: 1100, text: '    -d \'{"status":"failure","pipelineId":"build"}\'',    color: 'text-slate-400' },
  { delay: 1800, text: '',                                                        color: '' },
  { delay: 2000, text: '✓ Failure received — analyzing with AI...',              color: 'text-indigo-400' },
  { delay: 3200, text: '',                                                        color: '' },
  { delay: 3400, text: '  Root cause:  Missing env variable NODE_ENV',           color: 'text-emerald-400' },
  { delay: 4000, text: '  Confidence:  94%',                                     color: 'text-emerald-400' },
  { delay: 4500, text: '  Severity:    High  🔴',                                color: 'text-red-400' },
  { delay: 5200, text: '',                                                        color: '' },
  { delay: 5400, text: '✓ Pull request #142 opened automatically',               color: 'text-purple-400' },
  { delay: 6000, text: '  → github.com/acme/api/pull/142',                      color: 'text-slate-400' },
];

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    TERMINAL_LINES.forEach((line, i) => {
      const t = setTimeout(() => setVisibleLines((prev) => [...prev, i]), line.delay + 800);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d1a] shadow-2xl shadow-indigo-950/50">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-amber-500/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-xs text-slate-500 font-mono">fixmybuild — ingest demo</span>
      </div>

      {/* Terminal body */}
      <div className="p-5 font-mono text-sm min-h-[280px] space-y-1">
        {TERMINAL_LINES.map((line, i) => (
          <div
            key={i}
            className={`transition-opacity duration-300 ${visibleLines.includes(i) ? 'opacity-100' : 'opacity-0'} ${line.color}`}
          >
            {line.text || '\u00A0'}
          </div>
        ))}
        {/* Blinking cursor */}
        <span className="inline-block w-2 h-4 bg-indigo-400 cursor-blink mt-1" />
      </div>

      {/* Floating PR badge */}
      {visibleLines.length >= 11 && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3 py-2"
        >
          <GitPullRequest className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">PR #142 opened</span>
        </motion.div>
      )}
    </div>
  );
}

// ── Floating stats pills ───────────────────────────────────────────────────────
const PILLS = [
  { icon: Shield,     label: '94% confidence', color: 'text-indigo-400', bg: 'bg-indigo-500/12 border-indigo-500/25' },
  { icon: TrendingUp, label: '4.2 min to PR',  color: 'text-purple-400', bg: 'bg-purple-500/12 border-purple-500/25' },
  { icon: Zap,        label: 'High severity',  color: 'text-red-400',    bg: 'bg-red-500/12 border-red-500/25' },
];

// ── Hero ───────────────────────────────────────────────────────────────────────
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden gradient-mesh bg-grid pt-16">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div>
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Badge variant="indigo" className="animate-glow">
              <Zap className="w-3 h-3 fill-current" />
              AI-Powered CI/CD Analysis
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6"
          >
            Your pipelines{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              fail.
            </span>
            <br />
            We fix them —{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              automatically.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-xl"
          >
            FixMyBuild watches every CI/CD run across GitHub, GitLab, and Azure DevOps.
            When something breaks, AI analyzes the root cause, explains it in plain English,
            and opens a pull request with the fix — before your team even notices.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-12"
          >
            <Button size="lg" href="https://app.fixmybuild.io/register">
              Start free — no credit card
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" href="#how-it-works">
              See how it works
            </Button>
          </motion.div>

          {/* Floating pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap gap-2"
          >
            {PILLS.map((pill) => (
              <div
                key={pill.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium animate-float ${pill.bg} ${pill.color}`}
              >
                <pill.icon className="w-3.5 h-3.5" />
                {pill.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — terminal demo */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <TerminalDemo />

          {/* Glow under terminal */}
          <div className="absolute -inset-4 bg-indigo-600/10 rounded-3xl blur-2xl -z-10" />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#07070f] to-transparent pointer-events-none" />
    </section>
  );
}
