import { verify } from "@/lib/auth";
import { User } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const user = await User.findOne({ email: formData.get("email") });
    if (!user || !await verify(formData.get("password")?.toString()!, user.password!)) return new NextResponse(null, { status: 401 });
    return new NextResponse(null, { status: 200 });
}