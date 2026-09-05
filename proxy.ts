import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip patient auth redirects for admin and cron
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    return await updateSession(request);
  }

  const response = await updateSession(request);

  // Re-create client from cookies already refreshed on the request
  const { createServerClient } = await import("@supabase/ssr");
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Cookies already handled in updateSession
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = pathname === "/login";
  const isOnboarding = pathname === "/onboarding";
  const isProtected =
    pathname.startsWith("/book") ||
    pathname.startsWith("/appointments") ||
    pathname === "/";

  if (!user && (isProtected || isOnboarding)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && (isProtected || isOnboarding)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_completed_at")
      .eq("id", user.id)
      .maybeSingle();

    const completed = Boolean(profile?.profile_completed_at);

    if (!completed && !isOnboarding && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (completed && isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/book";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
