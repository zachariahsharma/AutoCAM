import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { registry } from "../openapi/registry";
import { apiKey, userSession } from "./auth";
import { PartCategories } from "../db/schema/cam";
import { scopeNames as scopes } from "../scopes";
import zod from "zod";

const PartCategoriesCreateSchema = createInsertSchema(PartCategories).omit({ team_id: true });
const PartCategoriesUpdateSchema = createUpdateSchema(PartCategories).omit({ team_id: true });
const PartCategory = createSelectSchema(PartCategories).meta({ id: "Part Category" });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/pc",
  tags: ["Part Categories"],
  security: [{ [userSession.name]: [] }],
  summary: "Get Part Categories (User)",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the part categories from the given team",
      content: {
        "application/json": {
          schema: zod.array(PartCategory)
        }
      }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/pc",
  tags: ["Part Categories"],
  security: [{ [apiKey.name]: [scopes.pc.read] }],
  summary: "Get Part Categories (API Key)",
  responses: {
    200: {
      description: "This endpoint returns the part categories from the api key's team",
      content: {
        "application/json": {
          schema: zod.array(PartCategory)
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/pc",
  tags: ["Part Categories"],
  summary: "Create Part Category (User)",
  description: "This endpoint requires the user's email to be verified",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "application/json": {
          schema: PartCategoriesCreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created part category",
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
  path: "/api/pc",
  tags: ["Part Categories"],
  summary: "Create Part Category (API Key)",
  security: [{ [apiKey.name]: [scopes.pc.write] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: PartCategoriesCreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created part category",
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
  path: "/api/pc/{id}",
  tags: ["Part Categories"],
  summary: "Update Part Category",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.pc.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) }),
    body: {
      content: {
        "application/json": {
          schema: PartCategoriesUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Part category successfully updated",
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/pc/{id}",
  tags: ["Part Categories"],
  summary: "Delete Part Category",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.pc.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) }),
  },
  responses: {
    204: {
      description: "Part category successfully deleted",
    }
  }
});
