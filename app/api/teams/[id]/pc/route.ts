import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { createPartCategory, getPartCategories } from "@/app/api/pc/route";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import zod, { ZodError } from "zod";
import { getUserId, routeResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: Props) {
  if (!await getUserId())
    return routeResponse(401);
  try {
    return await getPartCategories(req.nextUrl.searchParams, await zod.coerce.number().positive().parseAsync((await params).id));
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json(err.issues, { status: 422 });
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: Props) {
  if (!await getUserId())
    return routeResponse(401);
  try {
    return await createPartCategory(await req.json(), await zod.coerce.number().positive().parseAsync((await params).id));
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json(err.issues, { status: 422 });
    throw err;
  }
}