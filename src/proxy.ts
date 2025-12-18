import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js Proxy Handler (formerly Middleware)
 *
 * This proxy intercepts all matching requests to:
 * 1. Refresh expired Supabase auth tokens
 * 2. Manage session cookies between server and client
 * 3. Redirect unauthenticated users to login
 * 4. Redirect authenticated users away from auth pages
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Route matcher configuration
 *
 * The proxy runs on all routes EXCEPT:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico
 * - images folder (public assets)
 * - Static file extensions (svg, png, jpg, jpeg, gif, webp)
 * - API routes (handled separately with their own auth)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
