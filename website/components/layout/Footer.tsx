import { Zap } from 'lucide-react';

const LINKS = {
  Product: [
    { label: 'Features',     href: '#features' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Pricing',      href: '#pricing' },
    { label: 'How it works', href: '#how-it-works' },
  ],
  Company: [
    { label: 'About',     href: '#' },
    { label: 'Blog',      href: '#' },
    { label: 'Changelog', href: '#' },
    { label: 'Status',    href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',   href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Security',         href: '#' },
  ],
  Connect: [
    { label: 'GitHub',  href: '#' },
    { label: 'Twitter', href: '#' },
    { label: 'Email',   href: 'mailto:sales@fixmybuild.io' },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-black/8 dark:border-white/[0.06] py-16 bg-white/50 dark:bg-transparent overflow-hidden">
      {/* Subtle beam on top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-8 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 md:col-span-1">
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

            {/* Status indicator */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </div>
          </div>

          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
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
          ))}
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
