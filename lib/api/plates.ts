import { Plates } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, CommonAuthorization, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";

export const PlatesCreateSchema = createInsertSchema(Plates).omit({ category_id: true });
export const PlatesUpdateSchema = createUpdateSchema(Plates).omit({ category_id: true });
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
    ...CommonAuthorization
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
          schema: PlatesCreateSchema
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
    ...CommonAuthorization
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
          schema: PlatesUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Plate updated successfully",
    },
    ...CommonAuthorization
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
    ...CommonAuthorization
  }
});
