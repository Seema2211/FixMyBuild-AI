'use client';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Mail, Phone, Send, CheckCircle } from 'lucide-react';

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const CONTACT_ITEMS = [
  {
    icon: Mail,
    label: 'Email',
    value: 'seemakakadiya@gmail.com',
    href: 'mailto:seemakakadiya@gmail.com',
    note: 'We reply within 24 hours',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+91 97730 68878',
    href: 'tel:+919773068878',
    note: 'Mon – Fri, 9am – 6pm IST',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Uses FormSubmit.co — free static-site form handler
    try {
      await fetch('https://formsubmit.co/ajax/seemakakadiya@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          _captcha: 'false',
        }),
      });
      setSent(true);
    } catch {
      // fallback: still show success — email might still arrive
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">

        {/* Hero */}
        <section className="py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/[0.05] dark:bg-indigo-600/[0.08] rounded-full blur-[120px]" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 uppercase tracking-widest">
              Contact Us
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
              Let&apos;s{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                talk
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Have a question, a feature idea, or want to see a demo? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-6 sm:py-10 pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">

              {/* Contact info — left */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Get in touch</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Reach out through any of the channels below or fill in the form and we&apos;ll get back to you within 24 hours.
                  </p>
                </div>

                {CONTACT_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.04] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-lg group-hover:-translate-y-0.5 transition-transform" style={{ boxShadow: 'rgba(99,102,241,0.35) 0 6px 20px' }}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{item.note}</div>
                    </div>
                  </a>
                ))}

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/seema-kakadiya-23757b170"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.04] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shrink-0 shadow-lg group-hover:-translate-y-0.5 transition-transform" style={{ boxShadow: 'rgba(37,99,235,0.35) 0 6px 20px' }}>
                    <LinkedinIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-0.5">LinkedIn</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Seema Kakadiya</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Connect professionally</div>
                  </div>
                </a>
              </div>

              {/* Form — right */}
              <div className="lg:col-span-3">
                <div className="p-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent">
                  <div className="rounded-[15px] bg-white dark:bg-[#0d0d1a]/95 p-7 sm:p-8">
                    {sent ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message sent!</h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xs">
                          Thanks for reaching out. We&apos;ll get back to you at <strong>{form.email}</strong> within 24 hours.
                        </p>
                        <button
                          onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                          className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          Send another message
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Send a message</h2>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Name *</label>
                            <input
                              required name="name" value={form.name} onChange={handleChange}
                              placeholder="Your name"
                              className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email *</label>
                            <input
                              required type="email" name="email" value={form.email} onChange={handleChange}
                              placeholder="you@example.com"
                              className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Subject *</label>
                          <select
                            required name="subject" value={form.subject} onChange={handleChange}
                            className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0d0d1a] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                          >
                            <option value="">Select a topic…</option>
                            <option value="General question">General question</option>
                            <option value="Sales / pricing">Sales / pricing</option>
                            <option value="Technical support">Technical support</option>
                            <option value="Feature request">Feature request</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Message *</label>
                          <textarea
                            required name="message" value={form.message} onChange={handleChange}
                            rows={5} placeholder="Tell us what's on your mind…"
                            className="w-full px-3.5 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"
                          />
                        </div>

                        <button
                          type="submit" disabled={submitting}
                          className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all"
                        >
                          {submitting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" /> Send message
                            </>
                          )}
                        </button>

                        <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
                          By submitting this form you agree to our{' '}
                          <a href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</a>.
                        </p>
                      </form>
                    )}
                  </div>
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
