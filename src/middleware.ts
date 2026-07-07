import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSession } from "@/lib/session";
import { getHomePathForRole, isRoleAllowedOnPath } from "@/lib/roles";

const PUBLIC_PATHS = new Set(["/login", "/register", "/find-account"]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/tablet") ||
    pathname.startsWith("/reservations") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkin")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("yo_session")?.value;
  const session = token ? await decodeSession(token) : null;

  if (session && isPublicPath(pathname)) {
    const home = getHomePathForRole(session.role);
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL(getHomePathForRole(session.role), request.url));
  }

  if (!session && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isProtectedPath(pathname) && !isRoleAllowedOnPath(
    session.role,
    pathname,
    session.isServerAdmin ?? false,
  )) {
    return NextResponse.redirect(new URL(getHomePathForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
