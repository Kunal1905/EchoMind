import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const posthogIngestionHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
const posthogAssetsHost = posthogIngestionHost
  .replace("https://eu.i.posthog.com", "https://eu-assets.i.posthog.com")
  .replace("https://us.i.posthog.com", "https://us-assets.i.posthog.com");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/pulse/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: "/pulse/array/:path*",
        destination: `${posthogAssetsHost}/array/:path*`,
      },
      {
        source: "/pulse/:path*",
        destination: `${posthogIngestionHost}/:path*`,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(nextConfig, {
  org: "null-hcl",
  project: "echomind-nextjs",
  // Relay browser events through EchoMind so privacy tools do not block Sentry's ingest domain.
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
