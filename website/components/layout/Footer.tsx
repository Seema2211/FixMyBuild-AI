import { Zap, Mail, Phone } from 'lucide-react';

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-black/8 dark:border-white/[0.06] py-16 bg-white/50 dark:bg-transparent overflow-hidden">
      {/* Subtle beam on top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10 sm:mb-12">

          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-indigo-500/30 blur-md group-hover:bg-indigo-500/50 transition-all" />
                <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white fill-white" />
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Fix<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">My</span>Build
              </span>
            </a>
            <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
              AI-powered CI/CD failure analysis. Fix your pipelines before your team notices.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Features',     href: '/#features' },
                { label: 'How it works', href: '/#how-it-works' },
                { label: 'Integrations', href: '/#integrations' },
                { label: 'Pricing',      href: '/#pricing' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us',          href: '/about' },
                { label: 'Contact Us',        href: '/contact' },
                { label: 'Privacy Policy',    href: '/privacy' },
                { label: 'Terms & Conditions',href: '/terms' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:seemakakadiya@gmail.com"
                  className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  seemakakadiya@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+919773068878"
                  className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  +91 97730 68878
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/seema-kakadiya-23757b170"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <LinkedinIcon className="w-4 h-4 shrink-0" />
                  linkedin.com/in/seema-kakadiya-23757b170
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-black/8 dark:border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} FixMyBuild. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Built for developer teams who ship fast.
          </p>
        </div>
      </div>
    </footer>
  );
}
