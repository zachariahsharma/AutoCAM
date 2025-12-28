import { withAuth } from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema/entities";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  getAuthType,
  parseJsonBody,
  handleDatabaseError,
  routeResponse,
  validateAuthType,
  routeFactory
} from "@/lib/api-utils";

const CreateInput = zod.object({
  name: zod.string(),
});

export async function POST(req: NextRequest) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const body = await parseJsonBody(await req.json(), CreateInput);
  if (!body.success) return body.response;

  return await withAuth(authType, async tx => {
    try {
      const [team] = await tx.insert(Teams).values({
        ...body.data,
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

export const GET = routeFactory(async (req, authType, tx) => {
  if (authType.userId)
    return routeResponse(200, await tx.query.Teams.findMany());
  const team = await tx.query.Teams.findFirst();
  if (!team) return routeResponse(403);
  return routeResponse(200, team);
});
