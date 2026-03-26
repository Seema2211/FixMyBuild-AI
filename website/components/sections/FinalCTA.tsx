'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function FinalCTA() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/12 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Headline */}
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Stop debugging.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Start shipping.
            </span>
          </h2>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            FixMyBuild catches your CI/CD failures, explains them in plain English,
            and fixes them — automatically. Your team ships faster. Your pipelines stay green.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" href="https://app.fixmybuild.io/register">
              Start free — no credit card
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" href="mailto:sales@fixmybuild.io">
              <Mail className="w-4 h-4" />
              Talk to us
            </Button>
          </div>

          <p className="mt-6 text-sm text-slate-600">
            Free plan available · 14-day Pro trial · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}
