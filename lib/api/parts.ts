import "@/lib/openapi/registry";
import { Parts } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";

export const PartsCreateSchema = createInsertSchema(Parts).extend({ file: zod.instanceof(ArrayBuffer) }).openapi("PartsCreate");
export const PartsUpdateSchema = createUpdateSchema(Parts).omit({ file: true }).openapi("PartsUpdate");
export const PartsGetSchema = createSelectSchema(Parts).omit({ file: true }).openapi("PartsGet");

// OpenAPI route definitions
registry.registerPath({
  method: "patch",
  path: "/api/parts/{id}",
  tags: ["Parts"],
  description: "Update a part",
  request: {
    params: zod.object({ id: zod.number() }),
    body: {
      content: {
        "application/json": {
          schema: PartsUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Part updated - no content",
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/parts/{id}",
  tags: ["Parts"],
  description: "Delete a part",
  request: {
    params: zod.object({ id: zod.number() }),
  },
  responses: {
    204: {
      description: "Part deleted - no content",
    }
  }
});
