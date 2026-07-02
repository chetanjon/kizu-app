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

  // /r/<token> is intentionally public (rec-as-invite preview before signup).
  const protectedPaths = ["/home", "/tonight", "/queue", "/you", "/drop", "/groups", "/join", "/admin"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = "/login";
    url.searchParams.set("next", returnTo);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/home/:path*",
    "/tonight/:path*",
    "/queue/:path*",
    "/you/:path*",
    "/drop/:path*",
    "/groups/:path*",
    "/join/:path*",
    "/admin/:path*",
  ],
};
