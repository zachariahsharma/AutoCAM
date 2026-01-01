import { teamIdFromDigest } from "@/lib/auth/server";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { TeamMembers } from "@/lib/db/schema/entities";
import { eq } from "drizzle-orm";
import { registry } from "@/lib/openapi/registry";
import zod from "zod";
import { CommonAuthorization, ValidationError } from "../common";
import { apiKey, userSession } from "../auth";

const Member = zod.object({ user: zod.email(), admin: zod.boolean() });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/members",
  tags: ["Teams"],
  summary: "Get Team Members (User)",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "Returns the members of the team",
      content: {
        "application/json": {
          schema: zod.array(Member)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "get",
  path: "/api/teams/members",
  tags: ["Teams"],
  summary: "Get Team Members (API Key)",
  security: [{ [apiKey.name]: [] }],
  responses: {
    200: {
      description: "Returns the members of the team that the key corresponds to.",
      content: {
        "application/json": {
          schema: zod.array(Member)
        }
      }
    },
    ...CommonAuthorization,
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  id ??= await teamIdFromDigest(tx, authType);
  
  return routeResponse(200, await parseJsonBody((await tx.query.TeamMembers.findMany({
    where: eq(TeamMembers.team_id, id),
    with: { user: true },
  })).map(x => ({ ...x, user: x.user.email })), zod.array(Member)));
});