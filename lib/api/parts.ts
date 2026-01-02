import { Parts } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";
import { CommonAuthorization, Conflict, ValidationError } from "./common";
import { parseJsonBody, parseJsonFile, routeFactory, routeResponse } from ".";
import { eq } from "drizzle-orm";

const CreateSchema = createInsertSchema(Parts).omit({ file: true, category_id: true });
const UpdateSchema = createUpdateSchema(Parts).omit({ file: true, category_id: true });
const Part = createSelectSchema(Parts).omit({ file: true, category_id: true }).openapi("Part");

registry.registerPath({
  method: "get",
  path: "/api/pc/{id}/parts",
  tags: ["Parts"],
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.read] }
  ],
  summary: "Get Parts",
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the parts from the given part category",
      content: {
        "application/json": {
          schema: zod.array(Part)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/pc/{id}/parts",
  tags: ["Parts"],
  summary: "Create Part",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: CreateSchema.openapi({ description: "Part info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Part file upload" })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created part",
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
  path: "/api/parts/{id}",
  tags: ["Parts"],
  summary: "Update Part",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part" }) }),
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
      description: "Part updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/parts/{id}",
  tags: ["Parts"],
  summary: "Delete Part",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part" }) }),
  },
  responses: {
    204: {
      description: "Part deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return routeResponse(200, await parseJsonBody(await tx.query.Parts.findMany({
    where: eq(Parts.category_id, id)
  }), zod.array(Part)));
});

export const POST = routeFactory(async (req, authType, tx, category_id) => {
  if (!category_id) return routeResponse(422);
  const { data, file } = await parseJsonFile(await req.formData(), CreateSchema);
  const [id] = await tx.insert(Parts).values({ ...data, file, category_id }).returning({ id: Parts.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), UpdateSchema);
  return tx.update(Parts).set(body).where(eq(Parts.id, id)).returning({ id: Parts.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(Parts).where(eq(Parts.id, id)).returning({ id: Parts.id });
}, { emailVerifiedNeeded: true })
