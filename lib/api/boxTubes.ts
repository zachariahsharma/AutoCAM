import "@/lib/openapi/registry";
import { BoxTubes } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";

export const BoxTubesCreateSchema = createInsertSchema(BoxTubes).extend({ file: zod.instanceof(ArrayBuffer) }).openapi("BoxTubesCreate");
export const BoxTubesUpdateSchema = createUpdateSchema(BoxTubes).omit({ file: true }).openapi("BoxTubesUpdate");
export const BoxTubesGetSchema = createSelectSchema(BoxTubes).omit({ file: true }).openapi("BoxTubesGet");

// OpenAPI route definitions
registry.registerPath({
  method: "get",
  path: "/api/boxTubes",
  tags: ["Box Tubes"],
  description: "Get all box tubes for a team",
  responses: {
    200: {
      description: "List of box tubes",
      content: {
        "application/json": {
          schema: zod.array(BoxTubesGetSchema)
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/boxTubes",
  tags: ["Box Tubes"],
  description: "Create a new box tube",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: zod.string().openapi({ description: "JSON data as string" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "File upload" })
          }).openapi("BoxTubesFormData")
        }
      }
    }
  },
  responses: {
    201: {
      description: "Box tube created",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() }) //.openapi("BoxTubeIdResponse")
        }
      }
    }
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/boxTubes/{id}",
  tags: ["Box Tubes"],
  description: "Update a box tube",
  request: {
    params: zod.object({ id: zod.number() }),
    body: {
      content: {
        "application/json": {
          schema: BoxTubesUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Box tube updated - no content",
    }
  }
});
