import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — no one can embed this site in an iframe
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Stop browsers guessing MIME types (drives XSS vectors)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Only send the origin as referrer when crossing origins
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable browser features the site doesn't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS: browsers must use HTTPS for 2 years (add preload once domain is live)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // CSP: tightly scoped for a static Next.js marketing site
  // 'unsafe-inline' for styles (Tailwind) and 'unsafe-eval' for Next.js dev overlay
  // Tighten further once you add a nonce-based approach for scripts
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Apply security headers to every route
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Compress responses
  compress: true,

  // Strip X-Powered-By header (don't advertise Next.js version)
  poweredByHeader: false,
};

export default nextConfig;
