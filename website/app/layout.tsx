import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'FixMyBuild — AI-Powered CI/CD Failure Analysis',
    template: '%s | FixMyBuild',
  },
  description:
    'FixMyBuild automatically analyzes CI/CD pipeline failures with AI, explains root causes in plain English, and opens pull requests with fixes — before your team even notices.',
  keywords: [
    'CI/CD failure analysis', 'GitHub Actions fix', 'GitLab CI debugging',
    'AI DevOps', 'pipeline monitoring', 'auto fix pull request',
  ],
  authors: [{ name: 'FixMyBuild' }],
  creator: 'FixMyBuild',
  metadataBase: new URL('https://fixmybuild.io'),
  openGraph: {
    type: 'website', locale: 'en_US', url: 'https://fixmybuild.io',
    siteName: 'FixMyBuild',
    title: 'FixMyBuild — AI-Powered CI/CD Failure Analysis',
    description: 'Stop debugging CI/CD failures manually. FixMyBuild uses AI to analyze, explain, and automatically fix pipeline failures.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FixMyBuild — AI-Powered CI/CD Failure Analysis',
    description: 'Stop debugging CI/CD failures manually. Let AI do it.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
