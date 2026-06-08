import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Baseline security headers for a PII + payments app. These are low-risk
// (they don't restrict script/style sources, so they won't break Stripe/Supabase),
// while closing clickjacking, MIME-sniffing, referrer-leak and transport gaps.
// A full Content-Security-Policy (script-src/connect-src allowlist) should be
// layered on next, ideally rolled out in report-only mode first.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  // Defense-in-depth against clickjacking (modern equivalent of X-Frame-Options).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Sentry wraps the config for sourcemaps + tunneling. It is inert at runtime
// until NEXT_PUBLIC_SENTRY_DSN is set; sourcemap upload is skipped without
// SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN, so the build still succeeds.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
