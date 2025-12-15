import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (request.nextUrl.pathname.startsWith("/login")) {
    if (session)
      return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }
  if (session) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|\\.well-known|api\\/auth\\/sign-in).*)'
  ]
}