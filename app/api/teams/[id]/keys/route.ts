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

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }
  
  const teamIdResult = await parseParamId((await params).id);
  if (!teamIdResult.success) return teamIdResult.response;

  const keys = (await withAuth({ userId: authType.userId }, async tx => {
    return await tx.query.TeamKeys.findMany({
      where: eq(TeamKeys.team_id, teamIdResult.data),
      columns: { name: true, id: true, scopes: true }
    });
  }));
  return routeResponse(200, keys);
}

const CreateInput = zod.object({
  name: zod.string(),
  scopes: zod.array(zod.string())
})

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }
  
  const teamIdResult = await parseParamId((await params).id);
  if (!teamIdResult.success) return teamIdResult.response;
  
  const bodyResult = await parseJsonBody(await req.json(), CreateInput);
  if (!bodyResult.success) return bodyResult.response;

  const token = crypto.randomBytes(32).toString("hex");

  return await withAuth({ userId: authType.userId }, async tx => {
    try {
      await tx.insert(TeamKeys).values({
        digest: crypto.createHmac("sha256", "key").update(token).digest("hex"),
        ...bodyResult.data, team_id: teamIdResult.data
      });
      return routeResponse(201, { token });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
