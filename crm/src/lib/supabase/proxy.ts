import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route configuration for authentication
 * Enterprise-grade route protection with explicit definitions
 */
const ROUTE_CONFIG = {
  // Routes that don't require authentication
  public: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ],
  // Routes that authenticated users should be redirected away from
  // Note: /reset-password is NOT here because authenticated users need access
  // (e.g., after accepting an invite, they're authenticated but need to set password)
  authOnly: [
    "/login",
    "/register",
    "/forgot-password",
  ],
  // Default redirect for authenticated users leaving auth pages
  defaultAuthenticatedRedirect: "/",
  // Default redirect for unauthenticated users trying to access protected routes
  defaultUnauthenticatedRedirect: "/login",
} as const;

/**
 * Check if a pathname matches any route in the given list
 * Supports exact matches and prefix matches (e.g., /auth/callback/*)
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match for nested routes
    if (pathname.startsWith(`${route}/`)) return true;
    return false;
  });
}

/**
 * Updates the user session and handles authentication redirects
 *
 * This function:
 * 1. Creates a Supabase server client with proper cookie handling
 * 2. Refreshes expired auth tokens automatically
 * 3. Redirects unauthenticated users to login
 * 4. Redirects authenticated users away from auth pages
 *
 * IMPORTANT: Do not add any code between createServerClient() and
 * supabase.auth.getUser() - this can cause random logout issues.
 */
export async function updateSession(request: NextRequest) {
  // Create initial response - will be modified if cookies need to be set
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create Supabase server client with cookie handlers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First set cookies on the request (for downstream handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          });
          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: Do not add code between createServerClient and getUser()
  // This can cause session synchronization issues and random logouts

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Log auth errors in development for debugging
  if (error && process.env.NODE_ENV === "development") {
    console.error("[Proxy] Auth error:", error.message);
  }

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = matchesRoute(pathname, ROUTE_CONFIG.public);
  const isAuthOnlyRoute = matchesRoute(pathname, ROUTE_CONFIG.authOnly);

  // Case 1: Unauthenticated user trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTE_CONFIG.defaultUnauthenticatedRedirect;
    // Preserve the original destination for post-login redirect
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Case 2: Authenticated user trying to access auth-only pages (login, register, etc.)
  if (user && isAuthOnlyRoute) {
    const redirectUrl = request.nextUrl.clone();
    // Check if there's a redirectTo parameter
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    redirectUrl.pathname = redirectTo || ROUTE_CONFIG.defaultAuthenticatedRedirect;
    redirectUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(redirectUrl);
  }

  // Return the response with potentially updated cookies
  return supabaseResponse;
}
