import { teamIdFromDigest } from "@/lib/auth/server";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { TeamMembers } from "@/lib/db/schema/entities";
import { user } from "@/lib/db/schema/auth";
import { and, eq, sql } from "drizzle-orm";
import zod from "zod";
import { CommonAuthorization, registerTeamEndpoint, ValidationError } from "../common";
import { scopeNames as scopes } from "@/lib/scopes";

const Member = zod.object({ user: zod.string().email(), admin: zod.boolean() });

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

const UpdateMemberSchema = zod.object({ 
  email: zod.string().email(),
  admin: zod.boolean()
});

registerTeamEndpoint([scopes.teams.write], {
  method: "patch",
  path: "/api/members",
  tags: ["Teams"],
  summary: "Update Team Member Role",
  responses: {
    204: {
      description: "Member role updated successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
}, {}, { path: "/api/teams/members" });

export const PATCH = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const { email, admin } = await parseJsonBody(await req.json(), UpdateMemberSchema);

  // Find the user by email
  const foundUser = await tx.query.user.findFirst({
    where: eq(user.email, email)
  });

  if (!foundUser) {
    return routeResponse(404, { message: "User not found" });
  }

  await tx
    .update(TeamMembers)
    .set({ admin })
    .where(
      and(
        eq(TeamMembers.team_id, team_id),
        eq(TeamMembers.user_id, foundUser.id)
      )
    );

  return routeResponse(204);
});

const DeleteMemberSchema = zod.object({ email: zod.string().email() });

registerTeamEndpoint([scopes.teams.write], {
  method: "delete",
  path: "/api/members",
  tags: ["Teams"],
  summary: "Remove Team Member",
  responses: {
    204: {
      description: "Member removed successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
}, {}, { path: "/api/teams/members" });

export const DELETE = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const { email } = await parseJsonBody(await req.json(), DeleteMemberSchema);

  // Find the user by email
  const foundUser = await tx.query.user.findFirst({
    where: eq(user.email, email)
  });

  if (!foundUser) {
    return routeResponse(404, { message: "User not found" });
  }

  await tx
    .delete(TeamMembers)
    .where(
      and(
        eq(TeamMembers.team_id, team_id),
        eq(TeamMembers.user_id, foundUser.id)
      )
    );

  return routeResponse(204);
});