import type { NextConfig } from "next";

const renderApiOrigin = "https://echomind-1-de05.onrender.com";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://app.posthog.com https://us.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${renderApiOrigin} https://api.vapi.ai wss://api.vapi.ai https://*.vapi.ai wss://*.vapi.ai https://*.clerk.accounts.dev https://*.clerk.com https://checkout.razorpay.com https://api.razorpay.com https://app.posthog.com https://us.i.posthog.com`,
  "media-src 'self' blob:",
  "frame-src https://checkout.razorpay.com https://api.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), payment=(self), usb=(), fullscreen=(self)",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
