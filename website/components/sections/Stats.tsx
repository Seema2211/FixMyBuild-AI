'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, BrainCircuit, Timer, GitBranch } from 'lucide-react';

const STATS_CONFIG = [
  {
    rawValue: 12000,
    suffix: '+',
    display: '12,000+',
    label: 'Pipeline runs monitored',
    icon: Activity,
    accent: 'from-indigo-600 to-indigo-500',
    glowColor: 'rgba(99,102,241,0.35)',
    isSpecial: false,
  },
  {
    rawValue: 89,
    suffix: '%',
    display: '89%',
    label: 'Average AI confidence',
    icon: BrainCircuit,
    accent: 'from-purple-600 to-purple-500',
    glowColor: 'rgba(168,85,247,0.35)',
    isSpecial: false,
  },
  {
    rawValue: 0,
    suffix: '',
    display: '4.2 min',
    label: 'Mean time to PR',
    icon: Timer,
    accent: 'from-emerald-600 to-teal-500',
    glowColor: 'rgba(16,185,129,0.35)',
    isSpecial: true,
  },
  {
    rawValue: 3,
    suffix: '',
    display: '3',
    label: 'CI/CD platforms supported',
    icon: GitBranch,
    accent: 'from-amber-600 to-orange-500',
    glowColor: 'rgba(245,158,11,0.35)',
    isSpecial: false,
  },
];

function CountUp({ end, suffix = '', isSpecial, display }: { end: number; suffix?: string; isSpecial: boolean; display: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || isSpecial) return;
    const duration = 1800;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, end, isSpecial]);

  if (isSpecial) {
    return <div ref={ref}>{display}</div>;
  }

  const formatted = end >= 1000 ? count.toLocaleString() : count.toString();
  return <div ref={ref}>{started ? `${formatted}${suffix}` : '0'}</div>;
}

export function Stats() {
  return (
    <section className="relative py-14 sm:py-20 overflow-hidden">
      {/* Top + bottom border beams */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

      {/* Subtle background */}
      <div className="absolute inset-0 bg-slate-50/60 dark:bg-white/[0.015]" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS_CONFIG.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Glass card */}
              <div className="p-px rounded-2xl bg-gradient-to-br from-white/15 via-white/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent from-slate-200/80">
                <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/80 backdrop-blur-sm p-4 sm:p-6 text-center">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.accent} flex items-center justify-center mx-auto mb-4`}
                    style={{ boxShadow: `0 8px 20px ${stat.glowColor}` }}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Animated number */}
                  <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-1 tabular-nums">
                    <CountUp
                      end={stat.rawValue}
                      suffix={stat.suffix}
                      isSpecial={stat.isSpecial}
                      display={stat.display}
                    />
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-500">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
