import "./invites";
import "./keys";
import "./members";

import { TeamKeys, TeamMembers, Teams } from "@/lib/db/schema/entities";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "../../scopes";
import { checkUserTeam, CommonAuthorization, Conflict, NotFound, parseJsonBody, parseJsonFile, routeFactory, routeResponse, s3DeleteWithPrefix, ValidationError } from "../common";
import { eq } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";
import { client } from "@/lib/aws";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const CreateSchema = createInsertSchema(Teams).omit({ owner: true, logo: true });
const UpdateSchema = createUpdateSchema(Teams).extend({
  owner: zod.email().optional()
}).omit({ logo: true });
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
        "multipart/form-data": {
          schema: zod.object({
            data: UpdateSchema,
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
  const schema = Team.extend({
    owner: zod.object({
      email: zod.email()
    }).transform(x => x.email).pipe(zod.email())
  });
  if (authType.userId) {
    const teams = (await tx.query.TeamMembers.findMany({
      where: eq(TeamMembers.user_id, authType.userId),
      with: { team: {
        with: { owner: true }
      } }
    })).map(x => x.team);
    return routeResponse(200, await parseJsonBody(teams, zod.array(schema)));
  }
  if (!authType.keyDigest) return routeResponse(401);
  const key = await tx.query.TeamKeys.findFirst({
    where: eq(TeamKeys.digest, authType.keyDigest),
    with: { team: {
      with: { owner: true }
    } }
  });
  if (!key) return routeResponse(403, { message: "API Key is not valid" });
  return routeResponse(200, await parseJsonBody(key.team, schema));
}, { user: {}, apiKey: { scopes: [scopes.teams.read] } });

export const POST = routeFactory(async (req, authType, tx) => {
  const body = await parseJsonBody(await req.json(), CreateSchema);
  const [id] = await tx.insert(Teams).values({
    ...body,
    owner: authType.userId!
  }).returning({ id: Teams.id });
  await tx.insert(TeamMembers).values({
    user_id: authType.userId!,
    team_id: id.id,
    admin: true
  });
  return routeResponse(201, id);
}, { user: { emailVerified: true } });

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
  const { data, files } = await parseJsonFile(await req.formData(), schema);
  if (!data) return routeResponse(422);
  let logo: string | undefined;
  if ("logo" in files)
    logo = `https://${process.env.AUTOCAM_BUCKET}.s3.amazonaws.com/teams/${id}/logo`
  await tx.update(Teams).set({ ...data, logo }).where(eq(Teams.id, id));
  if ("logo" in files) {
    await client.send(new PutObjectCommand({
      Bucket: process.env.AUTOCAM_BUCKET,
      Key: `teams/${id}/logo`,
      Body: await files["logo"].bytes(),
      ACL: "public-read",
      ContentType: files["logo"].type
    }));
  }
  return routeResponse(204);
}, { user: { emailVerified: true } });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const team = await tx.query.Teams.findFirst({
    where: eq(Teams.id, id),
    columns: { owner: true }
  });
  if (!team) return routeResponse(404);
  if (team.owner !== authType.userId) throw routeResponse(401, { message: "The user is not the owner of the team" });
  tx.delete(Teams).where(eq(Teams.id, id));
  await s3DeleteWithPrefix(`teams/${id}/`);
}, { user: { emailVerified: true } });
