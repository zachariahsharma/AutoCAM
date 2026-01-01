import { Plates } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "../../scopes";
import { CommonAuthorization, ValidationError } from "../codes";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";

const CreateSchema = createInsertSchema(Plates).omit({ category_id: true });
const UpdateSchema = createUpdateSchema(Plates).omit({ category_id: true });
const Plate = createSelectSchema(Plates).omit({ category_id: true }).meta({ id: "Plate" });

registry.registerPath({
  method: "get",
  path: "/api/pc/{id}/plates",
  tags: ["Plates"],
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.plates.read] }
  ],
  summary: "Get Plates",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the plates from the given part category",
      content: {
        "application/json": {
          schema: zod.array(Plate)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/pc/{id}/plates",
  tags: ["Plates"],
  summary: "Create Plate",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.plates.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) }),
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
      description: "Returns the ID of the created plate",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/plates/{id}",
  tags: ["Plates"],
  summary: "Update Plate",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.plates.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the plate" }) }),
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
      description: "Plate updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/plates/{id}",
  tags: ["Plates"],
  summary: "Delete Plate",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.plates.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the plate" }) }),
  },
  responses: {
    204: {
      description: "Plate deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return routeResponse(200, await parseJsonBody(await tx.query.Plates.findMany({
    where: eq(Plates.category_id, id)
  }), zod.array(Plate)));
});

export const POST = routeFactory(async (req, authType, tx, category_id) => {
  if (!category_id) return routeResponse(422);
  const data = await parseJsonBody(await req.json(), CreateSchema);
  const [id] = await tx.insert(Plates).values({ ...data, category_id }).returning({ id: Plates.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), UpdateSchema);
  return await tx.update(Plates).set(body).where(eq(Plates.id, id)).returning({ id: Plates.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return await tx.delete(Plates).where(eq(Plates.id, id)).returning({ id: Plates.id });
});
