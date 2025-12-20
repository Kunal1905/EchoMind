import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { db } from '@/config/db'
import { usersTable } from '@/config/schema'
import { eq } from 'drizzle-orm'
import { currentUser } from '@clerk/nextjs/server'
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
  } else {
    return; // everything else remains public
  }

  // Sync authenticated user to DB
  const { userId } = await auth();

  if (userId) {
    try {
      const user = await currentUser();

      if (user) {
        const existingUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, userId));

        if (existingUser.length === 0) {
          const email = user.emailAddresses[0]?.emailAddress || "";

          await db.insert(usersTable).values({
            id: userId,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous User",
            email: email
          });

          console.log("User synced to DB:", userId);
        }
      }
    } catch (error) {
      console.error("Error syncing user to database:", error);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|json|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}
