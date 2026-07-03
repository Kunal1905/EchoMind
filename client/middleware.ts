import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

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

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  // Enforce login on protected routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // Redirect to sign-in, then return back to the page after login
      const url = new URL('/sign-in', req.url);
      url.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|json|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}
