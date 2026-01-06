import "./invites";
import "./keys";
import "./members";

import { TeamMembers, Teams } from "@/lib/db/schema/entities";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "../../scopes";
import { CommonAuthorization, Conflict, NotFound, ValidationError } from "../common";
import { checkUserTeam, parseJsonBody, parseJsonFile, routeFactory, routeResponse, s3DeleteWithPrefix } from "..";
import { eq } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";
import { client } from "@/lib/aws";
import { paginateListObjectsV2, PutObjectCommand, PutObjectTaggingCommand } from "@aws-sdk/client-s3";

const CreateSchema = createInsertSchema(Teams).omit({ owner: true, logo: true });
const UpdateSchema = createUpdateSchema(Teams).extend({
  owner: zod.email().optional(),
  logo: zod.httpUrl().optional()
});
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
      description: "If the logo is a URL, use the application/json. If the logo is a file upload, use the multipart/form-data type.",
      content: {
        "application/json": {
          schema: UpdateSchema
        },
        "multipart/form-data": {
          schema: zod.object({
            data: UpdateSchema.omit({ logo: true }),
            logo: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Logo upload" })
          })
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
}, { requiredScopes: [scopes.teams.read] });

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
  await checkUserTeam(tx, authType, id, true);
  const schema = UpdateSchema.extend({
    owner: zod.email().optional().transform(async owner => {
      if (!owner) return;
      const newOwner = await tx.query.user.findFirst({ where: eq(user.email, owner) });
      if (!newOwner) throw routeResponse(404);
      return newOwner.id;
    })
  });
  const contentType = req.headers.get("content-type");
  if (!contentType) return routeResponse(422, { message: "Content-Type not defined" });
  if (contentType.includes("application/json")) {
    const body = await parseJsonBody(await req.json(), schema);
    return tx.update(Teams).set(body).where(eq(Teams.id, id)).returning({ id: Teams.id });
  } else if (contentType.includes("multipart/form-data")) {
    const { data, files } = await parseJsonFile(await req.formData(), schema.omit({ logo: true }));
    let teamExists: boolean;
    if (data) {
      const result = await tx.update(Teams).set(data).where(eq(Teams.id, id)).returning({ id: Teams.id });
      teamExists = result.length > 0;
    } else {
      teamExists = (await tx.query.Teams.findFirst({ where: eq(Teams.id, id) })) !== undefined;
    }
    if (!teamExists) return routeResponse(404);
    if ("logo" in files) {
      // TODO: Optimize into prev update query
      await tx.update(Teams).set({ logo: `https://${process.env.AUTOCAM_BUCKET}.s3.amazonaws.com/teams/${id}/logo` });
      await client.send(new PutObjectCommand({
        Bucket: process.env.AUTOCAM_BUCKET,
        Key: `teams/${id}/logo`,
        Body: await files["logo"].bytes(),
        ACL: "public-read",
        ContentType: files["logo"].type
      }));
    }
    return routeResponse(204);
  } else return routeResponse(422, { message: "Content-Type not valid" })
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const team = await tx.query.Teams.findFirst({
    where: eq(Teams.id, id),
    columns: { owner: true }
  });
  if (!team) return routeResponse(404);
  if (team.owner !== authType.userId) throw routeResponse(401, { message: "The user is not the owner of the team" });
  const result = tx.delete(Teams).where(eq(Teams.id, id)).returning({ id: Teams.id });
  await s3DeleteWithPrefix(`teams/${id}/`);
  return result;
}, { emailVerifiedNeeded: true });
