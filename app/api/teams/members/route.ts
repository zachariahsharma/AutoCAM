import { routeFactory, routeResponse } from "@/lib/api-utils";
import { AuthType, teamIdFromDigest } from "@/lib/auth";
import { Transaction } from "@/lib/db";
import { TeamMembers } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";

export const GET = routeFactory((req, authType, tx) => getTeamMembers(authType, tx));

export async function getTeamMembers(authType: AuthType, tx: Transaction, teamId?: number) {
  teamId ??= await teamIdFromDigest(tx, authType);

  return routeResponse(200, (await tx.query.TeamMembers.findMany({
    where: eq(TeamMembers.team_id, teamId!),
    with: { user: true },
    columns: {
      admin: true,
    }
  })).map(x => ({ ...x, user: x.user.email })));
}