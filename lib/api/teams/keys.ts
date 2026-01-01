import { TeamKeys } from "@/lib/db/schema/entities";
import { registry } from "@/lib/openapi/registry";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { userSession } from "../auth";
import { CommonAuthorization, Conflict, NotFound, ValidationError } from "../common";
import { ScopeEnum } from "@/lib/scopes";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const CreateSchema = createInsertSchema(TeamKeys).extend({ scopes: zod.array(ScopeEnum) }).omit({ team_id: true, digest: true });
const UpdateSchema = createUpdateSchema(TeamKeys).extend({ scopes: zod.array(ScopeEnum).optional() }).omit({ team_id: true, digest: true });
const Key = createSelectSchema(TeamKeys).omit({ team_id: true, digest: true }).meta({ id: "API Key" });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/keys",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Get API Keys",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "Returns the API keys for the team",
      content: {
        "application/json": {
          schema: zod.array(Key)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/keys",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Generate API Key",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
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
      description: "Returns the ID of the created API key",
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
  path: "/api/teams/keys/{id}",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Update API Key",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the API key" }) }),
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
      description: "API key updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/teams/keys/{id}",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Delete API Key",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the API key" }) })
  },
  responses: {
    204: {
      description: "API key deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return routeResponse(200, await parseJsonBody(await tx.query.TeamKeys.findMany({
    where: eq(TeamKeys.team_id, id),
  }), zod.array(Key)));
}, { emailVerifiedNeeded: true });

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  if (!team_id) return routeResponse(422);
  const token = crypto.randomBytes(32).toString("hex");
  const body = await parseJsonBody(await req.json(), CreateSchema);

  await tx.insert(TeamKeys).values({
    ...body, team_id,
    digest: crypto.createHmac("sha256", "key").update(token).digest("hex")
  });
  return routeResponse(201, { token });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(TeamKeys)
    .where(eq(TeamKeys.id, id))
    .returning({ id: TeamKeys.id });
}, { emailVerifiedNeeded: true });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), UpdateSchema);
  return tx.update(TeamKeys)
    .set(body)
    .where(eq(TeamKeys.id, id))
    .returning({ id: TeamKeys.id })
}, { emailVerifiedNeeded: true })
