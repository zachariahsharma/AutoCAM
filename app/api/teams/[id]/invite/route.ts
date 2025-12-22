import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { inviteEmail } from "../../invite/route";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: Props) {
  if (!await auth.api.getSession({ headers: await headers() }))
    return new NextResponse(null, { status: 401 });
  return await inviteEmail(await req.formData(), Number((await params).id));
}