'use client';
import { motion } from 'framer-motion';
import { STATS } from '@/lib/constants';

export function Stats() {
  return (
    <section className="relative py-16 border-y border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
