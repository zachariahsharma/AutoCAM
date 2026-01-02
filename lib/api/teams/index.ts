import { TeamMembers, Teams } from "@/lib/db/schema/entities";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "../../scopes";
import { CommonAuthorization, Conflict, NotFound, ValidationError } from "../common";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";

import "./invites";
import "./keys";
import "./members";
import { client } from "@/lib/aws";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const CreateSchema = createInsertSchema(Teams).omit({ owner: true, logo: true });
const UpdateSchema = createUpdateSchema(Teams).extend({ owner: zod.email().optional() });
const Team = createSelectSchema(Teams).openapi("Team", { description: "A team represents an group of users that contain shared resources, such as materials, machines, part categories, etc." });

// OpenAPI route definitions
registry.registerPath({
  method: "get",
  path: "/api/teams",
  tags: ["Teams"],
  summary: "Get Teams",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.teams.read] }
  ],
  responses: {
    200: {
      description: "If this endpoint is called with an API Key, a single team that the key corresponds to is returned. If the endpoint is called with a user session, a list of teams that the user is a part of is returned.",
      content: {
        "application/json": {
          schema: zod.union([
            Team,
            zod.array(Team)
          ])
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams",
  tags: ["Teams"],
  summary: "Create Team",
  description: "This endpoint requires the user's email to be verified",
  security: [{ [userSession.name]: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the id of the created team",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...Conflict
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/teams/{id}",
  tags: ["Teams"],
  summary: "Update Team",
  description: "This endpoint requires the user's email to be verified",
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the team that is being updated" }) }),
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
      description: "Team updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/teams/{id}",
  tags: ["Teams"],
  summary: "Delete Team",
  description: "This endpoint requires the user's email to be verified. The user must be the owner of the team",
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the team that is being deleted" }) }),
  },
  responses: {
    204: {
      description: "Team deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
});

export const GET = routeFactory(async (req, authType, tx) => {
  if (authType.userId)
    return routeResponse(200, await parseJsonBody(await tx.query.Teams.findMany(), zod.array(Team)));
  const team = await tx.query.Teams.findFirst();
  if (!team) return routeResponse(403, { message: "API Key is not valid" });
  return routeResponse(200, await parseJsonBody(team, Team));
});

export const POST = routeFactory(async (req, authType, tx) => {
  if (!authType.userId) return routeResponse(401, { message: "User session not found" });
  const body = await parseJsonBody(await req.json(), CreateSchema);
  const [id] = await tx.insert(Teams).values({
    ...body,
    owner: authType.userId
  }).returning({ id: Teams.id });
  await tx.insert(TeamMembers).values({
    user_id: authType.userId,
    team_id: id.id,
    admin: true
  });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), UpdateSchema.extend({
    owner: zod.email().optional().transform(async owner => {
      if (!owner) return;
      const newOwner = await tx.query.user.findFirst({ where: eq(user.email, owner) });
      if (!newOwner) throw routeResponse(404);
      return newOwner.id;
    })
  }));
  await client.send(new PutObjectCommand({
    Bucket: process.env.AUTOCAM_BUCKET,
    Key: `teams/${id}/logo`,
    Body: ""
  }));
  return tx.update(Teams).set({
    ...body,
    logo: undefined
  }).where(eq(Teams.id, id)).returning({ id: Teams.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(Teams).where(eq(Teams.id, id)).returning({ id: Teams.id });
}, { emailVerifiedNeeded: true });
