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

function addCspHeaders(response: NextResponse, nonce: string): NextResponse {
  // Dynamically configure connect-src, script-src, and frame-src for Clerk, Cloudflare Turnstile CAPTCHA, Google OAuth, custom domain, and Vapi
  let connectSrc = "connect-src 'self' https://echomind-1-de05.onrender.com https://api.vapi.ai wss://api.vapi.ai https://*.vapi.ai wss://*.vapi.ai https://c.daily.co https://*.daily.co wss://*.daily.co https://*.clerk.accounts.dev https://*.clerk.com https://clerk.echomind.co.in https://*.echomind.co.in https://echomind.co.in https://www.echomind.co.in https://challenges.cloudflare.com https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com https://app.posthog.com https://us.i.posthog.com";
  let scriptSrc = `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' blob: https://c.daily.co https://*.daily.co https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.echomind.co.in https://*.echomind.co.in https://echomind.co.in https://www.echomind.co.in https://challenges.cloudflare.com https://app.posthog.com https://us.i.posthog.com`;

  if (process.env.NODE_ENV !== "production") {
    // Allow any localhost/127.0.0.1 port for local development APIs and Hot Module Replacement
    connectSrc += " http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*";
    scriptSrc += " http://localhost:* http://127.0.0.1:*";
  }

  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https: https://img.clerk.com https://*.googleusercontent.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    connectSrc,
    "media-src 'self' blob:",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.echomind.co.in https://*.echomind.co.in https://echomind.co.in https://www.echomind.co.in https://challenges.cloudflare.com https://accounts.google.com https://c.daily.co https://*.daily.co",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
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
    // Match all request paths except static files (JS/CSS under _next/static, images, icons, etc.)
    // This guarantees non-existent asset requests (like /404javascript.js) trigger middleware and receive CSP headers.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}