import "@/lib/openapi/registry";
import { Materials } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";

export const MaterialsCreateSchema = createInsertSchema(Materials).omit({ team_id: true }).openapi("MaterialsCreate");
export const MaterialsUpdateSchema = createUpdateSchema(Materials).omit({ team_id: true }).openapi("MaterialsUpdate");
export const MaterialsGetSchema = createSelectSchema(Materials).openapi("MaterialsGet");

// OpenAPI route definitions
registry.registerPath({
  method: "get",
  path: "/api/materials",
  tags: ["Materials"],
  description: "Get all materials for a team",
  responses: {
    200: {
      description: "List of materials",
      content: {
        "application/json": {
          schema: zod.array(MaterialsGetSchema)
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/materials",
  tags: ["Materials"],
  description: "Create a new material",
  request: {
    body: {
      content: {
        "application/json": {
          schema: MaterialsCreateSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: "Material created",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    }
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/materials/{id}",
  tags: ["Materials"],
  description: "Update a material",
  request: {
    params: zod.object({ id: zod.number() }),
    body: {
      content: {
        "application/json": {
          schema: MaterialsUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Material updated - no content",
    }
  }
});
