import { Teams } from "@/lib/db/schema/entities";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";
import { CommonAuthorization, ValidationError } from "./codes";

export const TeamsCreateSchema = createInsertSchema(Teams).omit({ owner: true });
export const TeamsUpdateSchema = createUpdateSchema(Teams).extend({ owner: zod.email().optional() });
export const Team = createSelectSchema(Teams).meta({ id: "Team", description: "A team represents an group of users that contain shared resources, such as materials, machines, part categories, etc." });

// OpenAPI route definitions
registry.registerPath({
  method: "get",
  path: "/api/teams",
  tags: ["Teams"],
  summary: "Get Teams",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.teams.read] }
  ],
  responses: {
    200: {
      description: "If this endpoint is called with an API Key, a single team that the key corresponds to is returned. If the endpoint is called with a user session, a list of teams that the user is a part of is returned.",
      content: {
        "application/json": {
          schema: zod.union([
            Team,
            zod.array(Team)
          ])
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams",
  tags: ["Teams"],
  summary: "Create Team",
  description: "This endpoint requires the user's email to be verified",
  security: [{ [userSession.name]: [] }],
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
      description: "Returns the id of the created team",
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
  path: "/api/teams/{id}",
  tags: ["Teams"],
  summary: "Update Team",
  description: "This endpoint requires the user's email to be verified",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team that is being updated" }) }),
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
      description: "Team updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/teams/{id}",
  tags: ["Teams"],
  summary: "Delete Team",
  description: "This endpoint requires the user's email to be verified. The user must be the owner of the team",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team that is being deleted" }) }),
  },
  responses: {
    204: {
      description: "Team deleted successfully",
    },
    ...CommonAuthorization
  }
});
