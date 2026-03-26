import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'FixMyBuild Privacy Policy — how we collect, use, and protect your data.',
};

const LAST_UPDATED = 'March 26, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-black/8 dark:border-white/8">
        {title}
      </h2>
      <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i} className="relative before:absolute before:-left-4 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-indigo-500">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">

        {/* Hero */}
        <section className="py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/[0.05] dark:bg-indigo-600/[0.07] rounded-full blur-[100px]" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 uppercase tracking-widest">
              <Shield className="w-3 h-3" /> Legal
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-slate-500 dark:text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        {/* Content */}
        <article className="pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-px rounded-3xl bg-gradient-to-br from-indigo-500/15 via-purple-500/8 to-transparent mb-8">
              <div className="rounded-[23px] bg-white dark:bg-[#0d0d1a]/95 p-6 sm:p-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  FixMyBuild (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your personal information
                  and your right to privacy. This Privacy Policy explains what information we collect, how we use it,
                  and what rights you have in relation to it. By using FixMyBuild, you agree to the terms of this policy.
                </p>
              </div>
            </div>

            <Section title="1. Information We Collect">
              <p><strong className="text-slate-800 dark:text-slate-200">Account information:</strong> When you register, we collect your name, email address, and (optionally) your organisation name.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Pipeline & log data:</strong> When a CI/CD pipeline failure is ingested — either via our API or through OAuth-connected repository monitoring — we receive and process the error log excerpts you or your CI system sends us. We do not read or store full source code files.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Usage data:</strong> We collect information about how you interact with the platform — pages visited, features used, and actions taken — to improve the product.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Payment information:</strong> Billing is handled by Stripe, Inc. We do not store credit card numbers or full payment details on our servers. We receive only a tokenised reference from Stripe.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Communication data:</strong> If you contact us via email or the contact form, we retain that correspondence to respond and improve our support.</p>
            </Section>

            <Section title="2. How We Use Your Information">
              <List items={[
                'To provide, operate, and maintain the FixMyBuild platform',
                'To analyse pipeline failure logs using AI and return root-cause results to you',
                'To send transactional emails (failure alerts, invite notifications, password resets)',
                'To process payments and manage your subscription via Stripe',
                'To detect, prevent, and address technical issues or abuse',
                'To improve our AI models and product features using anonymised, aggregated usage data',
                'To respond to your enquiries and support requests',
                'To comply with legal obligations',
              ]} />
            </Section>

            <Section title="3. Data Retention">
              <p>Log excerpts and failure analysis data are retained according to your plan:</p>
              <List items={[
                'Free plan: 7 days',
                'Pro plan: 90 days',
                'Business plan: Unlimited (until account deletion)',
              ]} />
              <p>Account information is retained for as long as your account is active. Upon account deletion, your personal data is permanently removed within 30 days, except where we are required to retain it for legal or financial compliance purposes.</p>
            </Section>

            <Section title="4. Sharing of Your Information">
              <p>We do not sell your personal information. We share data only with the following categories of trusted third parties:</p>
              <List items={[
                'Stripe, Inc. — payment processing',
                'AI/LLM service providers — for analysing pipeline log excerpts (logs are not associated with your personal identity when sent for analysis)',
                'Cloud infrastructure providers — for hosting and database storage',
                'Analytics services — using anonymised, aggregated data only',
              ]} />
              <p>All third-party processors are contractually required to handle data in accordance with applicable data protection laws.</p>
            </Section>

            <Section title="5. Cookies">
              <p>We use cookies and similar tracking technologies to:</p>
              <List items={[
                'Maintain your authenticated session',
                'Remember your theme preference (dark/light mode)',
                'Measure usage patterns to improve the platform (analytics cookies)',
              ]} />
              <p>You can control cookie settings through your browser. Disabling session cookies will prevent you from logging in.</p>
            </Section>

            <Section title="6. Data Security">
              <p>We implement industry-standard security measures to protect your data:</p>
              <List items={[
                'All data in transit is encrypted using TLS (HTTPS)',
                'Passwords are hashed using BCrypt with a work factor of 12',
                'API keys are stored as SHA-256 hashes — the plain-text key is shown only once at creation',
                'Refresh tokens use 64-byte cryptographically random values, SHA-256 hashed in storage',
                'Database access is restricted to application-layer services only',
              ]} />
              <p>No method of electronic transmission or storage is 100% secure. We strive to protect your data but cannot guarantee absolute security.</p>
            </Section>

            <Section title="7. Your Rights (GDPR & CCPA)">
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>
              <List items={[
                'Right to access — request a copy of the data we hold about you',
                'Right to rectification — request correction of inaccurate data',
                'Right to erasure — request deletion of your personal data',
                'Right to restriction — request that we limit processing of your data',
                'Right to data portability — receive your data in a machine-readable format',
                'Right to object — object to processing based on legitimate interests',
                'Right to opt out of sale — we do not sell personal data',
              ]} />
              <p>To exercise any of these rights, contact us at <a href="mailto:seemakakadiya@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">seemakakadiya@gmail.com</a>. We will respond within 30 days.</p>
            </Section>

            <Section title="8. Children's Privacy">
              <p>FixMyBuild is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.</p>
            </Section>

            <Section title="9. International Data Transfers">
              <p>Your data may be processed in countries outside your own. We ensure that any such transfers comply with applicable data protection laws, including the use of Standard Contractual Clauses where required under GDPR.</p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a prominent notice in the product. The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent revision.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
              <div className="mt-3 space-y-1">
                <p><strong className="text-slate-800 dark:text-slate-200">Email:</strong>{' '}
                  <a href="mailto:seemakakadiya@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">seemakakadiya@gmail.com</a>
                </p>
                <p><strong className="text-slate-800 dark:text-slate-200">Phone:</strong>{' '}
                  <a href="tel:+919773068878" className="text-indigo-600 dark:text-indigo-400 hover:underline">+91 97730 68878</a>
                </p>
                <p><strong className="text-slate-800 dark:text-slate-200">LinkedIn:</strong>{' '}
                  <a href="https://www.linkedin.com/in/seema-kakadiya-23757b170" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Seema Kakadiya</a>
                </p>
              </div>
            </Section>
          </div>
        </article>

      </main>
      <Footer />
    </>
  );
}
