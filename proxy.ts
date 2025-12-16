import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(request: NextRequest) {
  return NextResponse.next();
  const session = await auth.api.getSession({ headers: request.headers })
  if (["/login", "/signup"].some(p => request.nextUrl.pathname.startsWith(p))) {
    if (session)
      return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }
  if (session) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    String.raw`((?!\/|\/_next|\.well-known|\/api\/auth).*)`
  ]
}