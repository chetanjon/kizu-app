import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Local JWT verification (ES256 signing keys) — validates + refreshes the
  // session without a network call to the Auth server on every request.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  // /r/<token> and /read/<id> gate themselves; / and /login are public.
  // Segment-aware match: bare startsWith would make "/log" swallow "/login".
  const protectedPaths = ["/home", "/tonight", "/queue", "/you", "/drop", "/log", "/groups", "/join", "/admin"];
  const path = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(p + "/"));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = "/login";
    url.searchParams.set("next", returnTo);
    return NextResponse.redirect(url);
  }

  // already signed in and on /login → straight into the app. Nobody should be
  // shown a sign-in card while they hold a working session.
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = next && next.startsWith("/") ? next.split("?")[0] : "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// LOAD-BEARING: every page route that can be someone's FIRST request of a
// visit must be matched here. Supabase refresh tokens are single-use: when a
// page renders without this middleware and the access token is expired, the
// server component refreshes the session but CANNOT persist the rotated
// cookies — the browser keeps the consumed refresh token, the next request
// trips Supabase's reuse detection, and the whole session is revoked (user
// gets bounced to sign-in). /log + /read were missing exactly this way.
// Add every new top-level route to this matcher.
export const config = {
  matcher: [
    "/",
    "/login",
    "/home/:path*",
    "/tonight/:path*",
    "/queue/:path*",
    "/you/:path*",
    "/drop/:path*",
    "/log/:path*",
    "/read/:path*",
    "/r/:path*",
    "/groups/:path*",
    "/join/:path*",
    "/admin/:path*",
  ],
};
