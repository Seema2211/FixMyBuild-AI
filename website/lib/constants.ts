// ── Pricing ───────────────────────────────────────────────────────────────────
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceAnnual: 0,
    description: 'Perfect for solo developers exploring FixMyBuild.',
    cta: 'Start free',
    ctaHref: 'https://app.fixmybuild.io/register',
    popular: false,
    features: [
      '3 repositories',
      '100 pipeline failures / month',
      '25 AI analyses / month',
      '1 team member',
      '7-day failure history',
      'Community support',
    ],
    limits: {
      repos: 3,
      failures: 100,
      aiAnalyses: 25,
      members: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceAnnual: 23,
    description: 'For growing teams that need automation and insights.',
    cta: 'Start Pro free',
    ctaHref: 'https://app.fixmybuild.io/register?plan=pro',
    popular: true,
    features: [
      '20 repositories',
      '5,000 pipeline failures / month',
      'Unlimited AI analyses',
      '10 team members',
      'AI auto-PR creation',
      'Pattern Intelligence — self-learning AI',
      'Trend analytics & insights',
      'Slack & email notifications',
      '90-day failure history',
      'Audit log',
      'Priority email support',
    ],
    limits: {
      repos: 20,
      failures: 5000,
      aiAnalyses: null,
      members: 10,
    },
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    priceAnnual: 79,
    description: 'For enterprises with unlimited scale and dedicated support.',
    cta: 'Contact sales',
    ctaHref: 'mailto:sales@fixmybuild.io',
    popular: false,
    features: [
      'Unlimited repositories',
      'Unlimited pipeline failures',
      'Unlimited AI analyses (priority)',
      'Unlimited team members',
      'AI auto-PR creation',
      'Pattern Intelligence — self-learning AI',
      'Trend analytics & insights',
      'Slack & email notifications',
      'Unlimited failure history',
      'Audit log',
      'Dedicated support & SLA',
      'Custom onboarding',
    ],
    limits: {
      repos: null,
      failures: null,
      aiAnalyses: null,
      members: null,
    },
  },
] as const;

// ── Integrations ──────────────────────────────────────────────────────────────
export const INTEGRATIONS = [
  { name: 'GitHub Actions', category: 'ci' },
  { name: 'GitLab CI', category: 'ci' },
  { name: 'Azure Pipelines', category: 'ci' },
  { name: 'Bitbucket Pipelines', category: 'ci' },
  { name: 'Slack', category: 'notify' },
  { name: 'Email', category: 'notify' },
  { name: 'Webhooks', category: 'notify' },
  { name: 'REST API', category: 'notify' },
] as const;

// ── Stats ─────────────────────────────────────────────────────────────────────
export const STATS = [
  { value: '12,000+', label: 'Pipeline runs monitored' },
  { value: '89%', label: 'Average AI confidence' },
  { value: '4.2 min', label: 'Mean time to PR' },
  { value: '4 providers', label: 'CI/CD platforms supported' },
] as const;

// ── FAQ ───────────────────────────────────────────────────────────────────────
export const FAQ = [
  {
    q: 'How does FixMyBuild access my CI/CD logs?',
    a: 'You connect your GitHub, GitLab, Azure DevOps, or Bitbucket account via OAuth. FixMyBuild reads pipeline run logs directly through the provider API — read-only access only unless you enable auto-PR creation.',
  },
  {
    q: 'Does it work with private repositories?',
    a: 'Yes. OAuth grants access to both public and private repositories. Your code and logs are processed securely and never stored beyond your configured retention period.',
  },
  {
    q: 'What AI model powers the analysis?',
    a: 'FixMyBuild uses a combination of large language models optimised for code and DevOps context. The model is not exposed externally — we manage model selection and updates automatically.',
  },
  {
    q: 'How accurate is the auto-PR fix? What if it\'s wrong?',
    a: 'FixMyBuild only creates a PR when AI confidence is ≥ 70%. Every PR is clearly labelled as AI-generated and requires your normal review and merge process — no auto-merge, ever. If a fix is wrong, simply close the PR.',
  },
  {
    q: 'Can I use FixMyBuild without giving it push access?',
    a: 'Absolutely. Analysis, severity triage, Slack alerts, and the dashboard all work with read-only access. Auto-PR creation is opt-in and requires write access per repository.',
  },
  {
    q: 'Is my code or log data stored? For how long?',
    a: 'Log excerpts used for analysis are stored per your plan\'s failure history (7 days on Free, 90 days on Pro, unlimited on Business). Full source code is never stored — only the relevant log context.',
  },
  {
    q: 'How does the ingest API work?',
    a: 'Send a POST request with your API key and the failure payload (pipeline ID, status, logs). FixMyBuild responds with a full AI analysis in under 3 seconds. Works with any CI/CD system that can make an HTTP call.',
  },
  {
    q: 'What happens when I hit my plan limit?',
    a: 'You\'ll receive a notification. Ingestion pauses for the current billing month. Your existing data, dashboard, and configuration are untouched. Upgrade at any time to resume immediately.',
  },
  {
    q: 'What is Pattern Intelligence?',
    a: 'Pattern Intelligence fingerprints recurring failure patterns and tracks whether each AI-suggested fix was accepted, rejected, or modified by your team. On Pro and Business plans, this history is injected into future AI analyses for the same pattern — giving higher confidence scores and proven fix suggestions for repeat failures. It learns from your codebase, not generic training data.',
  },
  {
    q: 'How does FixMyBuild get smarter over time?',
    a: 'Every time a fix PR is merged or closed, the outcome is automatically recorded via your VCS webhook. FixMyBuild builds a per-organisation pattern library — the more failures you process, the more context the AI has when the same pattern reappears. Free plan users still receive full AI analysis; historical context augmentation is a Pro+ feature.',
  },
] as const;
