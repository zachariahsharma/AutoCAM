import { NextRequest, NextResponse } from "next/server";
import { Params } from "../route";
import { getInvites, inviteEmail } from "../../invite/route";
import { getUserId, parseParamId, routeFactory, routeResponse } from "@/lib/api-utils";

export const POST = routeFactory<Params>(
  async (req, authType, tx, params) => inviteEmail(authType, tx, await req.json(), await parseParamId(params.id))
);

export const GET = routeFactory<Params>(
  async (req, authType, tx, params) => getInvites(authType, tx, await parseParamId(params.id))
)