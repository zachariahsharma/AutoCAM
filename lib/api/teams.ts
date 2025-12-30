import { Teams } from "@/lib/db/schema/entities";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";

export const TeamsCreateSchema = createInsertSchema(Teams).omit({ owner: true }).openapi("TeamsCreate");
export const TeamsUpdateSchema = createUpdateSchema(Teams).extend({ owner: zod.email().optional() }).openapi("TeamsUpdate");
export const TeamsGetSchema = createSelectSchema(Teams).openapi("TeamsGet");

// OpenAPI route definitions
registry.registerPath({
  method: "get",
  path: "/api/teams",
  tags: ["Teams"],
  description: "Get all teams",
  responses: {
    200: {
      description: "List of teams",
      content: {
        "application/json": {
          schema: TeamsGetSchema
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams",
  tags: ["Teams"],
  description: "Create a new team",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TeamsCreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Team created",
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
  path: "/api/teams/{id}",
  tags: ["Teams"],
  description: "Update a team",
  request: {
    params: zod.object({ id: zod.number() }),
    body: {
      content: {
        "application/json": {
          schema: TeamsUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Team updated - no content",
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/teams/{id}",
  tags: ["Teams"],
  description: "Delete a team",
  request: {
    params: zod.object({ id: zod.number() }),
  },
  responses: {
    204: {
      description: "Team deleted - no content",
    }
  }
});
