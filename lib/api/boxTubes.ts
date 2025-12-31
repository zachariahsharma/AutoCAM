import "@/lib/openapi/registry";
import { BoxTubes } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";

export const BoxTubesCreateSchema = createInsertSchema(BoxTubes).omit({ file: true, team_id: true });
export const BoxTubesUpdateSchema = createUpdateSchema(BoxTubes).omit({ file: true, team_id: true });
const BoxTube = createSelectSchema(BoxTubes).omit({ file: true, team_id: true }).meta({ id: "Box Tube" });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/boxTubes",
  tags: ["Box Tubes"],
  security: [{ [userSession.name]: [] }],
  summary: "Get Box Tubes (User)",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the box tubes from the given team",
      content: {
        "application/json": {
          schema: zod.array(BoxTube)
        }
      }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/boxTubes",
  tags: ["Box Tubes"],
  security: [{ [apiKey.name]: [scopes.boxTubes.read] }],
  summary: "Get Box Tubes (API Key)",
  responses: {
    200: {
      description: "This endpoint returns the box tubes from the API Key's team",
      content: {
        "application/json": {
          schema: zod.array(BoxTube)
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/boxTubes",
  tags: ["Box Tubes"],
  summary: "Create Box Tube (User)",
  description: "This endpoint requires the user's email to be verified",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: BoxTubesCreateSchema.meta({ description: "Box tube info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Box tube file upload" })
          }),
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created box tube",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/boxTubes",
  tags: ["Box Tubes"],
  summary: "Create Box Tube (API Key)",
  security: [{ [apiKey.name]: [scopes.boxTubes.write] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: BoxTubesCreateSchema.meta({ description: "Box tube info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Box tube file upload" })
          }),
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created box tube",
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
  path: "/api/boxTubes/{id}",
  tags: ["Box Tubes"],
  summary: "Update Box Tube",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.boxTubes.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the box tube" }) }),
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
      description: "Box tube updated successfully",
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/boxTubes/{id}",
  tags: ["Box Tubes"],
  summary: "Delete Box Tube",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.boxTubes.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the box tube" }) }),
  },
  responses: {
    204: {
      description: "Box tube deleted successfully",
    }
  }
});
