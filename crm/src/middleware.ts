import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js Middleware
 *
 * Intercepts all matching requests to:
 * 1. Refresh expired Supabase auth tokens (server-side)
 * 2. Manage session cookies between server and client
 * 3. Redirect unauthenticated users to login
 * 4. Redirect authenticated users away from auth pages
 *
 * IMPORTANT: This file MUST be named middleware.ts and export
 * a function named "middleware" for Next.js to recognize it.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Route matcher configuration
 *
 * Middleware runs on all routes EXCEPT:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico
 * - images folder (public assets)
 * - templates folder (email templates for GoTrue)
 * - Static file extensions (svg, png, jpg, jpeg, gif, webp, html)
 * - API routes (handled separately with their own auth)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|templates|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
