import { Machines } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, CommonAuthorization, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";

export const MachinesCreateSchema = createInsertSchema(Machines).omit({ team_id: true, file: true });
export const MachinesUpdateSchema = createUpdateSchema(Machines).omit({ team_id: true, file: true });
const Machine = createSelectSchema(Machines).omit({ team_id: true, file: true }).meta({ id: "Machine" })

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/machines",
  tags: ["Machines"],
  security: [{ [userSession.name]: [] }],
  summary: "Get Machines (User)",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the machines from the given team",
      content: {
        "application/json": {
          schema: zod.array(Machine)
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "get",
  path: "/api/machines",
  tags: ["Machines"],
  security: [{ [apiKey.name]: [scopes.machines.read] }],
  summary: "Get Machines (API Key)",
  responses: {
    200: {
      description: "This endpoint returns the part categories from the api key's team",
      content: {
        "application/json": {
          schema: zod.array(Machine)
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/machines",
  tags: ["Machines"],
  summary: "Create Machine (User)",
  description: "This endpoint requires the user's email to be verified",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: MachinesCreateSchema.meta({ description: "Machine info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Machine file upload" })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created machine",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "post",
  path: "/api/machines",
  tags: ["Machines"],
  summary: "Create Machine (API Key)",
  security: [{ [apiKey.name]: [scopes.machines.write] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: MachinesCreateSchema.meta({ description: "Machine info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Machine file upload" })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created machine",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/machines/{id}",
  tags: ["Machines"],
  summary: "Update Machine",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.machines.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the machine" }) }),
    body: {
      content: {
        "application/json": {
          schema: MachinesUpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Machine successfully updated",
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/machine/{id}",
  tags: ["Machines"],
  summary: "Delete Machine",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.machines.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the machine" }) }),
  },
  responses: {
    204: {
      description: "Machine successfully deleted",
    },
    ...CommonAuthorization
  }
});
