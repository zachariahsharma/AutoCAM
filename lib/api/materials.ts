import { Materials } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";
import { CommonAuthorization, ValidationError } from "./codes";

export const MaterialsCreateSchema = createInsertSchema(Materials).omit({ team_id: true });
export const MaterialsUpdateSchema = createUpdateSchema(Materials).omit({ team_id: true });
const Material = createSelectSchema(Materials).omit({ team_id: true }).meta({ id: "Material" })

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/materials",
  tags: ["Materials"],
  security: [{ [userSession.name]: [] }],
  summary: "Get Materials (User)",
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
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "get",
  path: "/api/materials",
  tags: ["Materials"],
  security: [{ [apiKey.name]: [scopes.materials.read] }],
  summary: "Get Materials (API Key)",
  responses: {
    200: {
      description: "This endpoint returns the part categories from the api key's team",
      content: {
        "application/json": {
          schema: zod.array(Material)
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/materials",
  tags: ["Materials"],
  summary: "Create Material (User)",
  description: "This endpoint requires the user's email to be verified",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: MaterialsCreateSchema.meta({ description: "Material info as stringified JSON" }),
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
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/materials",
  tags: ["Materials"],
  summary: "Create Material (API Key)",
  security: [{ [apiKey.name]: [scopes.materials.write] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: MaterialsCreateSchema.meta({ description: "Material info as stringified JSON" }),
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
    ...ValidationError
  }
});

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
          schema: MaterialsUpdateSchema
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
    ...CommonAuthorization
  }
});
