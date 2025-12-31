import { Parts } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";

export const PartsCreateSchema = createInsertSchema(Parts).omit({ file: true, category_id: true });
export const PartsUpdateSchema = createUpdateSchema(Parts).omit({ file: true, category_id: true });
export const PartsGetSchema = createSelectSchema(Parts).omit({ file: true });
export const Part = createSelectSchema(Parts).omit({ file: true, category_id: true }).meta({ id: "Part" });

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
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the parts from the given part category",
      content: {
        "application/json": {
          schema: zod.array(Part)
        }
      }
    }
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
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: PartsCreateSchema.meta({ description: "Part info as stringified JSON" }),
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
    }
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
    params: zod.object({ id: zod.number().meta({ description: "ID of the part" }) }),
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
      description: "Part updated successfully",
    }
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
    params: zod.object({ id: zod.number().meta({ description: "ID of the part" }) }),
  },
  responses: {
    204: {
      description: "Part deleted successfully",
    }
  }
});
