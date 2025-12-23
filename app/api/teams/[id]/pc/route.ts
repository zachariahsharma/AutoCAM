import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { createPartCategory, getPartCategories } from "@/app/api/pc/route";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import zod, { ZodError } from "zod";
import { getUserId, parseJsonBody, parseParamId, routeResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: Props) {
  if (!await getUserId())
    return routeResponse(401);
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await getPartCategories(req.nextUrl.searchParams, id.data);
}

export async function POST(req: NextRequest, { params }: Props) {
  if (!await getUserId())
    return routeResponse(401);
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await createPartCategory(await req.json(), id.data);
}