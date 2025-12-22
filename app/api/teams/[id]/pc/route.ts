import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { createPartCategory, getPartCategories } from "@/app/api/pc/route";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: Props) {
  if (!await auth.api.getSession({ headers: await headers() }))
    return new NextResponse(null, { status: 401 });
  return await getPartCategories(req.nextUrl.searchParams, Number((await params).id));
}

export async function POST(req: NextRequest, { params }: Props) {
  if (!await auth.api.getSession({ headers: await headers() }))
    return new NextResponse(null, { status: 401 });
  return await createPartCategory(await req.json(), Number((await params).id))
}