import "@/lib/openapi/registry";
import { Plates } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";

export const PlatesCreateSchema = createInsertSchema(Plates).openapi("PlatesCreate");
export const PlatesUpdateSchema = createUpdateSchema(Plates).openapi("PlatesUpdate");
export const PlatesGetSchema = createSelectSchema(Plates).openapi("PlatesGet");

// OpenAPI route definitions
registry.registerPath({
  method: "patch",
  path: "/api/plates/{id}",
  tags: ["Plates"],
  description: "Update a plate",
  request: {
    params: zod.object({ id: zod.number() }),
    body: {
      content: {
        "application/json": {
          schema: PlatesUpdateSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: "Plate updated",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/plates/{id}",
  tags: ["Plates"],
  description: "Delete a plate",
  request: {
    params: zod.object({ id: zod.number() }),
  },
  responses: {
    200: {
      description: "Plate deleted",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    }
  }
});
