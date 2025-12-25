import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { getInvites, inviteEmail } from "../../invite/route";
import { getUserId, parseParamId, routeResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: Props) {
  if (!await getUserId())
    return routeResponse(401);
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await inviteEmail(await req.json(), id.data);
}

export async function GET(req: NextRequest, { params }: Props) {
  if (!await getUserId())
    return routeResponse(401);
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await getInvites(id.data);
}