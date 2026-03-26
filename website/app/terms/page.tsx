import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'FixMyBuild Terms & Conditions — the rules that govern your use of our platform.',
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

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">

        {/* Hero */}
        <section className="py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/[0.05] dark:bg-purple-600/[0.07] rounded-full blur-[100px]" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 uppercase tracking-widest">
              <FileText className="w-3 h-3" /> Legal
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
              Terms &amp; Conditions
            </h1>
            <p className="text-slate-500 dark:text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        {/* Content */}
        <article className="pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-px rounded-3xl bg-gradient-to-br from-purple-500/15 via-indigo-500/8 to-transparent mb-8">
              <div className="rounded-[23px] bg-white dark:bg-[#0d0d1a]/95 p-6 sm:p-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of FixMyBuild
                  (&ldquo;Service&rdquo;), operated by FixMyBuild (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;). By creating an account
                  or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
                </p>
              </div>
            </div>

            <Section title="1. Acceptance of Terms">
              <p>By accessing or using FixMyBuild, you confirm that you are at least 16 years of age, have the legal authority to enter into these Terms on behalf of yourself or your organisation, and agree to comply with all applicable laws and regulations.</p>
            </Section>

            <Section title="2. Description of Service">
              <p>FixMyBuild is an AI-powered CI/CD failure analysis platform that:</p>
              <List items={[
                'Monitors connected repositories for pipeline failures',
                'Analyses error logs using artificial intelligence to identify root causes',
                'Classifies failures by severity and category',
                'Optionally creates pull requests with AI-suggested fixes (Pro+ plans)',
                'Sends notifications via Slack, email, or webhooks',
                'Tracks fix outcomes and learns from your team\'s feedback (Pattern Intelligence, Pro+)',
              ]} />
              <p>We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.</p>
            </Section>

            <Section title="3. Account Registration & Responsibility">
              <p>You are responsible for:</p>
              <List items={[
                'Providing accurate and current information when registering',
                'Maintaining the confidentiality of your login credentials and API keys',
                'All activity that occurs under your account',
                'Notifying us immediately of any unauthorised access at seemakakadiya@gmail.com',
              ]} />
              <p>You may not share accounts, create accounts using automated means, or impersonate any person or entity.</p>
            </Section>

            <Section title="4. Acceptable Use">
              <p>You agree not to use FixMyBuild to:</p>
              <List items={[
                'Violate any applicable law, regulation, or third-party rights',
                'Upload or transmit malicious code, viruses, or harmful data',
                'Attempt to gain unauthorised access to any system, account, or network',
                'Reverse engineer, decompile, or extract our source code or AI models',
                'Use the Service to build a competing product without our written consent',
                'Abuse the API in a way that causes excessive load or degrades service for other users',
                'Scrape, harvest, or collect data from the Service in an automated manner without prior written approval',
              ]} />
              <p>Violation of this section may result in immediate account suspension or termination.</p>
            </Section>

            <Section title="5. Subscriptions, Billing & Refunds">
              <p><strong className="text-slate-800 dark:text-slate-200">Free plan:</strong> Available at no cost, subject to usage limits. No payment details required.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Paid plans:</strong> Pro and Business plans are billed monthly or annually in advance. All payments are processed securely by Stripe, Inc.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Cancellation:</strong> You may cancel your subscription at any time through the Settings &gt; Billing page. Your plan remains active until the end of the current billing period. No refunds are issued for unused time within a billing period.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Plan limits:</strong> If you exceed your plan&apos;s usage limits, ingestion will pause until the next billing cycle or until you upgrade. Existing data is preserved.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Price changes:</strong> We will give at least 30 days&apos; notice before changing subscription prices. Continued use after the effective date constitutes acceptance.</p>
            </Section>

            <Section title="6. Intellectual Property">
              <p><strong className="text-slate-800 dark:text-slate-200">Our IP:</strong> FixMyBuild and all related technology, branding, and content are owned by us or our licensors. Nothing in these Terms grants you ownership of our intellectual property.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Your IP:</strong> You retain full ownership of your source code, pipeline logs, and any data you submit to the Service. By using FixMyBuild, you grant us a limited, non-exclusive licence to process that data solely to provide the Service to you.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Feedback:</strong> If you submit ideas, suggestions, or feedback, you grant us a perpetual, royalty-free licence to use them to improve the Service.</p>
            </Section>

            <Section title="7. AI-Generated Content Disclaimer">
              <p>FixMyBuild uses artificial intelligence to analyse pipeline logs and suggest fixes. You acknowledge that:</p>
              <List items={[
                'AI suggestions are provided as-is and may not always be correct',
                'You are solely responsible for reviewing, testing, and approving any AI-generated pull request before merging',
                'We do not guarantee that AI-suggested fixes will resolve your specific failure',
                'No auto-merge is ever performed — all PRs require your explicit approval',
              ]} />
            </Section>

            <Section title="8. Service Availability">
              <p>We aim to provide a reliable service but cannot guarantee 100% uptime. Scheduled maintenance, unplanned outages, or third-party failures may cause temporary unavailability. We are not liable for losses arising from service downtime.</p>
              <p>We do not offer a Service Level Agreement (SLA) on Free or Pro plans. Business plan customers may negotiate SLA terms separately.</p>
            </Section>

            <Section title="9. Privacy">
              <p>Your use of the Service is also governed by our <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
            </Section>

            <Section title="10. Termination">
              <p><strong className="text-slate-800 dark:text-slate-200">By you:</strong> You may delete your account at any time via Settings &gt; Organisation. Account deletion is permanent and irreversible.</p>
              <p><strong className="text-slate-800 dark:text-slate-200">By us:</strong> We may suspend or terminate your account immediately and without prior notice if you:</p>
              <List items={[
                'Violate these Terms or our Acceptable Use Policy',
                'Fail to pay outstanding amounts after 14 days of a failed charge',
                'Engage in fraudulent, abusive, or illegal activity',
              ]} />
              <p>Upon termination, your right to use the Service ceases immediately. We will retain your data for up to 30 days to allow you to export it, after which it will be permanently deleted.</p>
            </Section>

            <Section title="11. Limitation of Liability">
              <p>To the maximum extent permitted by applicable law:</p>
              <List items={[
                'FixMyBuild is provided "as is" without warranties of any kind, express or implied',
                'We are not liable for any indirect, incidental, special, consequential, or punitive damages',
                'Our total liability to you for any claim arising out of these Terms or the Service shall not exceed the amount you paid us in the 12 months preceding the claim, or £100 (whichever is greater)',
              ]} />
            </Section>

            <Section title="12. Indemnification">
              <p>You agree to indemnify and hold harmless FixMyBuild and its founders, employees, and agents from any claims, liabilities, damages, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.</p>
            </Section>

            <Section title="13. Governing Law & Dispute Resolution">
              <p>These Terms are governed by the laws of India. Any disputes arising under these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in accordance with Indian arbitration law.</p>
            </Section>

            <Section title="14. Changes to These Terms">
              <p>We may update these Terms at any time. We will provide at least 14 days&apos; notice of material changes via email or in-product notice. Continued use of the Service after the effective date constitutes your acceptance of the revised Terms.</p>
            </Section>

            <Section title="15. Contact">
              <p>For questions about these Terms, contact us:</p>
              <div className="mt-3 space-y-1">
                <p><strong className="text-slate-800 dark:text-slate-200">Email:</strong>{' '}
                  <a href="mailto:seemakakadiya@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">seemakakadiya@gmail.com</a>
                </p>
                <p><strong className="text-slate-800 dark:text-slate-200">Phone:</strong>{' '}
                  <a href="tel:+919773068878" className="text-indigo-600 dark:text-indigo-400 hover:underline">+91 97730 68878</a>
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
