import { TeamKeys } from "@/lib/db/schema/entities";
import { registry } from "@/lib/openapi/registry";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { userSession } from "../auth";
import { CommonAuthorization, ValidationError } from "../codes";
import { ScopeEnum } from "@/lib/scopes";

export const KeysCreateSchema = createInsertSchema(TeamKeys).extend({ scopes: zod.array(ScopeEnum) }).omit({ team_id: true, digest: true });
export const KeysUpdateSchema = createUpdateSchema(TeamKeys).extend({ scopes: zod.array(ScopeEnum).optional() }).omit({ team_id: true, digest: true });
export const Key = createSelectSchema(TeamKeys).omit({ team_id: true, digest: true }).meta({ id: "API Key" });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/keys",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Get API Keys",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "Returns the API keys for the team",
      content: {
        "application/json": {
          schema: zod.array(Key)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/keys",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Generate API Key",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "application/json": {
          schema: KeysCreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created API key",
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
  path: "/api/teams/keys/{id}",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Update API Key",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the API key" }) }),
    body: {
      content: {
        "application/json": {
          schema: KeysUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "API key updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/teams/keys/{id}",
  tags: ["API Keys"],
  security: [{ [userSession.name]: [] }],
  summary: "Delete API Key",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the API key" }) })
  },
  responses: {
    204: {
      description: "API key deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});
