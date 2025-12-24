import { withAuth } from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema/entities";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  getAuthType,
  parseJsonBody,
  handleDatabaseError,
  routeResponse,
  validateAuthType
} from "@/lib/api-utils";

const CreateInput = zod.object({
  name: zod.string(),
});

export async function POST(req: NextRequest) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const bodyResult = await parseJsonBody(await req.json(), CreateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth({ userId: authType.userId }, async tx => {
    try {
      const [team] = await tx.insert(Teams).values({
        ...bodyResult.data,
        owner: authType.userId!,
      }).returning({ id: Teams.id });

      // Assign current user to this team
      await tx.insert(TeamMembers).values({
        user_id: authType.userId!,
        team_id: team.id,
        admin: true,
      });
      return routeResponse(201, { id: team.id });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function GET() {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }
  return await withAuth(authType, async tx => {
    if (authType.userId)
      return routeResponse(200, await tx.query.Teams.findMany());
    else if (authType.keyDigest)
      return routeResponse(200, await tx.query.Teams.findFirst());
  });
}
