import { withAuth } from "@/lib/db";
import { NextRequest } from "next/server";
import { Props } from "../route";
import { eq } from "drizzle-orm";
import { TeamKeys } from "@/lib/schema/entities";
import crypto from "crypto";
import zod from "zod";
import {
  parseParamId,
  parseJsonBody,
  handleDatabaseError,
  routeResponse,
  getAuthType,
  validateAuthType
} from "@/lib/api-utils";
import { ScopeEnum } from "@/lib/scopes";

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }
  
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;

  const keys = (await withAuth(authType, async tx => {
    return await tx.query.TeamKeys.findMany({
      where: eq(TeamKeys.team_id, id.data),
      columns: { name: true, id: true, scopes: true }
    });
  }));
  return routeResponse(200, keys);
}

const CreateInput = zod.object({
  name: zod.string(),
  scopes: zod.array(ScopeEnum)
})

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }
  
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  
  const body = await parseJsonBody(await req.json(), CreateInput);
  if (!body.success) return body.response;

  const token = crypto.randomBytes(32).toString("hex");

  return await withAuth({ userId: authType.userId }, async tx => {
    try {
      await tx.insert(TeamKeys).values({
        digest: crypto.createHmac("sha256", "key").update(token).digest("hex"),
        ...body.data, team_id: id.data
      });
      return routeResponse(201, { token });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
