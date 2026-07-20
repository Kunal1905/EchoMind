import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

// Generate a cryptographically secure nonce for CSP
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/premium(.*)',
])

const isProtectedRoute = createRouteMatcher([
  '/echo(.*)',
  '/history(.*)',
])

// Base CSP directives without unsafe-inline - nonce will be added per-request
const CSP_BASE_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-eval' https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://app.posthog.com https://us.i.posthog.com",
  "style-src 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://echomind-1-de05.onrender.com https://api.vapi.ai wss://api.vapi.ai https://*.vapi.ai wss://*.vapi.ai https://*.clerk.accounts.dev https://*.clerk.com https://checkout.razorpay.com https://api.razorpay.com https://app.posthog.com https://us.i.posthog.com",
  "media-src 'self' blob:",
  "frame-src https://checkout.razorpay.com https://api.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
];

function addCspHeaders(response: NextResponse, nonce: string): NextResponse {
  const cspDirectives = [
    ...CSP_BASE_DIRECTIVES,
    `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://app.posthog.com https://us.i.posthog.com`,
    `style-src 'self' 'nonce-${nonce}'`,
  ];
  const cspHeader = cspDirectives.join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), payment=(self), usb=(), fullscreen=(self)');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Pass nonce to the response so it can be used in components
  response.headers.set('x-csp-nonce', nonce);

  return response;
}

export default clerkMiddleware(async (auth, req) => {
  const nonce = generateNonce();

  if (isPublicRoute(req)) {
    return addCspHeaders(NextResponse.next(), nonce);
  }

  // Enforce login on protected routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // Redirect to sign-in, then return back to the page after login
      const url = new URL('/sign-in', req.url);
      url.searchParams.set('redirect_url', req.url);
      const redirectResponse = NextResponse.redirect(url);
      return addCspHeaders(redirectResponse, nonce);
    }
  }

  return addCspHeaders(NextResponse.next(), nonce);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|json|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}