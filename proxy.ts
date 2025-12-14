import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
    const token = request.cookies.get("token");
    if (!token) {
        if (request.nextUrl.pathname.startsWith("/login"))
            return NextResponse.next();
        return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
        await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_SECRET!));
        return NextResponse.next();
    } catch (err) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|\\.well-known|api\\/login).*)'
    ]
}