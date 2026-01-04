import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "./lib/api";

export async function proxy(request: NextRequest) {
  const userId = await getUserId();
  if (["/login", "/signup"].some(p => request.nextUrl.pathname.startsWith(p))) {
    if (userId)
      return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }
  if (userId) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!$|_next/|index/|auth|api).*)"
  ]
}