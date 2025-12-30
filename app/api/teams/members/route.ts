import { getAuthType, routeResponse, validateAuthType } from "@/lib/api-utils";
import { teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { TeamMembers } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";

export async function GET() {
  return await getTeamMembers();
}

export async function getTeamMembers(teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  return await withAuth(authType, async tx => {
    return routeResponse(200, (await tx.query.TeamMembers.findMany({
      where: eq(TeamMembers.team_id, teamId!),
      with: { user: true },
      columns: {
        admin: true,
      }
    })).map(x => ({ ...x, user: x.user.email })));
  });
}