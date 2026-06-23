import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicSignupAllowed } from "@/lib/signup-config";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/register" && !isPublicSignupAllowed()) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)",
  ],
};
