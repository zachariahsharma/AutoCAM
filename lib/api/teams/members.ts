import { teamIdFromDigest } from "@/lib/auth/server";
import { checkUserTeam, parseJsonBody, routeFactory, routeResponse } from "..";
import { TeamMembers, Teams } from "@/lib/db/schema/entities";
import { user } from "@/lib/db/schema/auth";
import { and, eq, sql } from "drizzle-orm";
import zod from "zod";
import { CommonAuthorization, registerTeamEndpoint, ValidationError } from "../common";
import { scopeNames as scopes } from "@/lib/scopes";
import { registry } from "@/lib/openapi/registry";

const Member = zod.object({ 
  email: zod.email(), 
  name: zod.string(), 
  admin: zod.boolean(), 
  isOwner: zod.boolean() 
});

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
  await checkUserTeam(tx, authType, id);
  
  // Get team to find owner
  const team = await tx.query.Teams.findFirst({
    where: eq(Teams.id, id)
  });
  const ownerId = team?.owner;
  
  return routeResponse(200, await parseJsonBody((await tx.query.TeamMembers.findMany({
    where: eq(TeamMembers.team_id, id),
    with: { user: true },
  })).map(x => ({ 
    ...x, 
    email: x.user.email, 
    name: x.user.name || x.user.email.split("@")[0], 
    isOwner: x.user_id === ownerId 
  })), zod.array(Member)));
}, { requiredScopes: [scopes.teams.read] });

const UpdateSchema = zod.object({ 
  email: zod.email(),
  admin: zod.boolean()
});

registry.registerPath({
  method: "patch",
  path: "/api/teams/{id}/members",
  tags: ["Teams"],
  summary: "Update Team Member Role",
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Team ID" }) }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Member role updated successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const PATCH = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);
  await checkUserTeam(tx, authType, team_id, true);

  const { email, admin } = await parseJsonBody(await req.json(), UpdateSchema);

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

const DeleteSchema = zod.object({ email: zod.email() });

registry.registerPath({
  method: "delete",
  path: "/api/teams/{id}/members",
  tags: ["Teams"],
  summary: "Remove Team Member",
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Team ID" }) }),
    query: DeleteSchema
  },
  responses: {
    204: {
      description: "Member removed successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const DELETE = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);
  await checkUserTeam(tx, authType, team_id, true);

  const { email } = await parseJsonBody({
    email: req.nextUrl.searchParams.get("email")
  }, DeleteSchema);

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