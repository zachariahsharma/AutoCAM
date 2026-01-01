import { teamIdFromDigest } from "@/lib/auth/server";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { TeamMembers } from "@/lib/db/schema/entities";
import { eq } from "drizzle-orm";
import zod from "zod";
import { CommonAuthorization, registerTeamEndpoint, ValidationError } from "../common";
import { scopeNames as scopes } from "@/lib/scopes";

const Member = zod.object({ user: zod.email(), admin: zod.boolean() });

registerTeamEndpoint([scopes.teams.read], {
  method: "get",
  path: "/api/members",
  tags: ["Teams"],
  summary: "Get Team Members",
  responses: {
    200: {
      description: "Returns the members of the team",
      content: {
        "application/json": {
          schema: zod.array(Member)
        }
      }
    },
    ...CommonAuthorization
  }
}, {}, { path: "/api/teams/members" });

export const GET = routeFactory(async (req, authType, tx, id) => {
  id ??= await teamIdFromDigest(tx, authType);
  
  return routeResponse(200, await parseJsonBody((await tx.query.TeamMembers.findMany({
    where: eq(TeamMembers.team_id, id),
    with: { user: true },
  })).map(x => ({ ...x, user: x.user.email })), zod.array(Member)));
});