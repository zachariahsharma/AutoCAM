import zod from "zod";
import { scopeNames as scopes } from "../scopes";
import { CommonAuthorization, Conflict, registerTeamEndpoint, ValidationError } from "./common";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { Tools } from "../db/schema/cam";
import { registry } from "../openapi/registry";
import { apiKey, userSession } from "./auth";
import { parseJsonBody, parseJsonFile, routeFactory, routeResponse } from ".";
import { teamIdFromDigest } from "../auth/server";
import { eq } from "drizzle-orm";

const CreateSchema = createInsertSchema(Tools).omit({ file: true, team_id: true });
const UpdateSchema = createUpdateSchema(Tools).omit({ file: true, team_id: true });
const Tool = createSelectSchema(Tools).omit({ file: true, team_id: true }).openapi("Tool");

registerTeamEndpoint([scopes.tools.read], {
  method: "get",
  path: "/api/tools",
  tags: ["Tools"],
  summary: "Get Tools",
  responses: {
    200: {
      description: "This endpoint returns the tools from the given team",
      content: {
        "application/json": {
          schema: zod.array(Tool)
        }
      }
    },
    ...CommonAuthorization
  }
});

registerTeamEndpoint([scopes.tools.write], {
  method: "post",
  path: "/api/tools",
  tags: ["Tools"],
  summary: "Create Tool",
  description: "This endpoint requires the user's email to be verified",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: CreateSchema.openapi({ description: "Tool info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Tool file upload" })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created tool",
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
  path: "/api/tools/{id}",
  tags: ["Tools"],
  summary: "Update Tool",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.tools.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the tool" }) }),
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
      description: "Tool successfully updated"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/tools/{id}",
  tags: ["Tools"],
  summary: "Delete Tool",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.tools.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the tool" }) })
  },
  responses: {
    204: {
      description: "Tool successfully deleted",
      ...CommonAuthorization,
      ...ValidationError
    }
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  id ??= await teamIdFromDigest(tx, authType);
  return routeResponse(200, await parseJsonBody(await tx.query.Materials.findMany({
    where: eq(Tools.team_id, id)
  }), zod.array(Tool)));
});

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);
  const { data, files } = await parseJsonFile(await req.formData(), CreateSchema);
  if (!data) return routeResponse(422);
  const [id] = await tx.insert(Tools).values({
    ...data,
    file: files["file"],
    team_id
  }).returning({ id: Tools.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), UpdateSchema);
  return tx.update(Tools).set(body).where(eq(Tools.id, id)).returning({ id: Tools.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(Tools).where(eq(Tools.id, id)).returning({ id: Tools.id });
}, { emailVerifiedNeeded: true });
