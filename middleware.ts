import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicSignupAllowed } from "@/lib/signup-config";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/register" && !isPublicSignupAllowed()) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/register",
};
