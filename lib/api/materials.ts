import { Materials } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";
import { CommonAuthorization, Conflict, registerTeamEndpoint, ValidationError } from "./common";
import { parseJsonBody, routeFactory, routeResponse } from ".";
import { teamIdFromDigest } from "../auth/server";
import { eq } from "drizzle-orm";

const CreateSchema = createInsertSchema(Materials).omit({ team_id: true });
const UpdateSchema = createUpdateSchema(Materials).omit({ team_id: true });
const Material = createSelectSchema(Materials).omit({ team_id: true }).meta({ id: "Material" })

registerTeamEndpoint({
  method: "get",
  path: "/api/materials",
  tags: ["Materials"],
  summary: "Get Materials",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the materials from the given team",
      content: {
        "application/json": {
          schema: zod.array(Material)
        }
      }
    },
    ...CommonAuthorization,
  }
}, [scopes.materials.read]);

registerTeamEndpoint({
  method: "post",
  path: "/api/materials",
  tags: ["Materials"],
  summary: "Create Material",
  description: "This endpoint requires the user's email to be verified",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: CreateSchema.meta({ description: "Material info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Material file upload" })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created material",
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
}, [scopes.materials.write]);

registry.registerPath({
  method: "patch",
  path: "/api/materials/{id}",
  tags: ["Materials"],
  summary: "Update Material",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.materials.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the material" }) }),
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
      description: "Material successfully updated",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/material/{id}",
  tags: ["Materials"],
  summary: "Delete Material",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.materials.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the material" }) }),
  },
  responses: {
    204: {
      description: "Material successfully deleted",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  id ??= await teamIdFromDigest(tx, authType);
  return routeResponse(200, await parseJsonBody(await tx.query.Materials.findMany({
    where: eq(Materials.team_id, id)
  }), zod.array(Material)));
});

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const body = await parseJsonBody(await req.json(), CreateSchema);

  const [id] = await tx.insert(Materials).values({ ...body, team_id }).returning({ id: Materials.id });
  return routeResponse(200, id);
});

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), createUpdateSchema(Materials));

  return tx.update(Materials).set(body).where(eq(Materials.id, id));
});

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(Materials).where(eq(Materials.id, id));
});

