import { User } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { verify } from "argon2";

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const user = await User.findOne({ email: formData.get("email") });
    if (!user || !await verify(user.password!, formData.get("password")?.toString()!)) return new NextResponse(null, { status: 401 });
    const expiryTime = +process.env.JWT_EXPIRY_TIME!;
    const token = await new SignJWT({ email: user.email })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(process.env.JWT_EXPIRY_TIME!)
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!))
    const response = NextResponse.redirect("/", 303);
    response.cookies.set("token", token, {
        secure: true,
        maxAge: expiryTime,
        httpOnly: true,
        sameSite: "strict",
    })
    return response;
}