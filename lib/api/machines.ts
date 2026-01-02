import { Machines } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";
import { CommonAuthorization, Conflict, registerTeamEndpoint, ValidationError } from "./common";

const CreateSchema = createInsertSchema(Machines).omit({ team_id: true, file: true });
const UpdateSchema = createUpdateSchema(Machines).omit({ team_id: true, file: true });
const Machine = createSelectSchema(Machines).omit({ team_id: true, file: true }).openapi("Machine")

registerTeamEndpoint([scopes.machines.read], {
  method: "get",
  path: "/api/machines",
  tags: ["Machines"],
  summary: "Get Machines",
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

registerTeamEndpoint([scopes.machines.write], {
  method: "post",
  path: "/api/machines",
  tags: ["Machines"],
  summary: "Create Machine",
  description: "This endpoint requires the user's email to be verified",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: CreateSchema.openapi({ description: "Machine info as stringified JSON" }),
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
    ...CommonAuthorization,
    ...ValidationError,
    ...Conflict
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
    params: zod.object({ id: zod.number().openapi({ description: "ID of the machine" }) }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Machine successfully updated",
    },
    ...CommonAuthorization,
    ...ValidationError
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
    params: zod.object({ id: zod.number().openapi({ description: "ID of the machine" }) }),
  },
  responses: {
    204: {
      description: "Machine successfully deleted",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});
