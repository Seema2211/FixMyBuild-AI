import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Zap, Target, Users, Sparkles, GitPullRequest, BrainCircuit, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about FixMyBuild — the AI-powered CI/CD failure analysis platform built to help engineering teams stop firefighting and start shipping.',
};

const VALUES = [
  {
    icon: BrainCircuit,
    title: 'AI that explains, not just detects',
    description: 'A failure alert without a root cause is just noise. We built FixMyBuild to give engineers plain-English answers, not raw log dumps.',
    accent: 'from-indigo-600 to-indigo-500',
    glow: 'rgba(99,102,241,0.35)',
  },
  {
    icon: GitPullRequest,
    title: 'Fix the pipeline, not just flag it',
    description: "Most monitoring tools tell you something broke. We go further — FixMyBuild opens the pull request so you can review, approve, and move on.",
    accent: 'from-purple-600 to-purple-500',
    glow: 'rgba(168,85,247,0.35)',
  },
  {
    icon: Sparkles,
    title: 'Gets smarter with every fix',
    description: 'Pattern Intelligence tracks which fixes your team accepts or rejects. Recurring failures get progressively higher confidence and better suggestions.',
    accent: 'from-amber-600 to-orange-500',
    glow: 'rgba(245,158,11,0.35)',
  },
  {
    icon: Users,
    title: 'Built for teams, not just solo devs',
    description: 'Role-based access, team invitations, audit logs, and per-org isolation — FixMyBuild is designed to scale with your engineering org.',
    accent: 'from-emerald-600 to-teal-500',
    glow: 'rgba(16,185,129,0.35)',
  },
];

const STATS = [
  { value: '< 3s', label: 'Average analysis time' },
  { value: '89%', label: 'Average AI confidence' },
  { value: '4', label: 'CI/CD platforms supported' },
  { value: '∞', label: 'Patterns learned over time' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">

        {/* Hero */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/[0.05] dark:bg-indigo-600/[0.08] rounded-full blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 uppercase tracking-widest">
              About Us
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
              Built by engineers,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                for engineers
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              FixMyBuild was born from a simple frustration — too many late nights staring at CI logs,
              trying to figure out why a pipeline broke. We believed there had to be a better way.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-px rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent">
              <div className="rounded-[23px] bg-white dark:bg-[#0d0d1a]/95 p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg" style={{ boxShadow: 'rgba(99,102,241,0.4) 0px 8px 24px' }}>
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our mission</h2>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-6">
                  &ldquo;Engineers should spend their time{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    building
                  </span>
                  , not debugging pipelines.&rdquo;
                </p>
                <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    Every minute spent hunting through CI logs is a minute not spent on the features your users care about.
                    The average engineering team loses hours every week to pipeline failures — not because the problem is hard,
                    but because the right information isn&apos;t surfaced at the right moment.
                  </p>
                  <p>
                    FixMyBuild changes that. The moment a pipeline fails, our AI reads the logs, identifies the exact root cause,
                    classifies the severity, and — when confident enough — opens a pull request with the fix already applied.
                    Your team gets back to work in minutes, not hours.
                  </p>
                  <p>
                    And unlike one-size-fits-all AI tools, FixMyBuild learns from your team&apos;s actual fix history through
                    Pattern Intelligence. The more you use it, the smarter it gets for your specific codebase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center p-6 rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-white/[0.02]">
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-1">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-14 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
                What we stand for
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Every product decision at FixMyBuild comes back to these four principles.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {VALUES.map((v) => (
                <div key={v.title} className="p-px rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-white/8 dark:via-white/4 dark:to-transparent from-slate-200 hover:from-indigo-300/40 transition-all duration-500">
                  <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/90 p-6 h-full">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${v.accent} flex items-center justify-center mb-4 shadow-lg`}
                      style={{ boxShadow: `0 6px 20px ${v.glow}` }}
                    >
                      <v.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{v.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who we are */}
        <section className="py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
                The team
              </h2>
            </div>
            <div className="flex justify-center">
              <div className="p-px rounded-2xl bg-gradient-to-br from-indigo-500/30 via-purple-500/15 to-transparent max-w-sm w-full">
                <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/95 p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl" style={{ boxShadow: 'rgba(99,102,241,0.4) 0px 12px 30px' }}>
                    <span className="text-2xl font-extrabold text-white">SK</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Seema Kakadiya</h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-3">Founder & Builder</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                    Software engineer passionate about developer tooling, AI, and making the CI/CD
                    experience less painful for engineering teams everywhere.
                  </p>
                  <a
                    href="https://www.linkedin.com/in/seema-kakadiya-23757b170"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/25 bg-indigo-500/8 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
                    </svg>
                    Connect on LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="p-px rounded-3xl bg-gradient-to-br from-indigo-500/25 via-purple-500/15 to-transparent">
              <div className="rounded-[23px] bg-white dark:bg-[#0d0d1a]/95 px-8 py-12">
                <Zap className="w-10 h-10 mx-auto mb-4 text-indigo-500" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Ready to stop firefighting?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Join teams already using FixMyBuild to turn pipeline failures into auto-fixes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="https://app.fixmybuild.io/register" className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all">
                    Start free — no credit card
                  </a>
                  <a href="/contact" className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-xl border border-black/12 dark:border-white/15 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-white transition-all">
                    <Mail className="w-4 h-4" /> Get in touch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
