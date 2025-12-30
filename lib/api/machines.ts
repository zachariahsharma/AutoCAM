import "@/lib/openapi/registry";
import { Machines } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";

export const MachinesCreateSchema = createInsertSchema(Machines, { 
  file: zod.instanceof(ArrayBuffer) 
}).omit({ id: true, team_id: true }).openapi("MachinesCreate");

export const MachinesUpdateSchema = createUpdateSchema(Machines, {
  file: zod.instanceof(ArrayBuffer)
}).omit({ id: true, team_id: true }).openapi("MachinesUpdate");

export const MachinesGetSchema = createSelectSchema(Machines).openapi("MachinesGet");

// OpenAPI route definitions
registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/machines",
  tags: ["Machines"],
  description: "Get all machines for a team",
  request: {
    params: zod.object({ id: zod.number() }),
  },
  responses: {
    200: {
      description: "List of machines",
      content: {
        "application/json": {
          schema: zod.array(MachinesGetSchema)
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/machines",
  tags: ["Machines"],
  description: "Create a new machine",
  request: {
    params: zod.object({ id: zod.number() }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: zod.string().openapi({ description: "JSON data as string" }),
            file: zod.instanceof(File).openapi({ description: "File upload" })
          }).openapi("MachinesFormData")
        }
      }
    }
  },
  responses: {
    201: {
      description: "Machine created",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() }) //.openapi("MachineIdResponse")
        }
      }
    }
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/machines/{id}",
  tags: ["Machines"],
  description: "Update a machine",
  request: {
    params: zod.object({ id: zod.number() }),
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
      description: "Machine updated - no content",
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/machines/{id}",
  tags: ["Machines"],
  description: "Delete a machine",
  request: {
    params: zod.object({ id: zod.number() }),
  },
  responses: {
    204: {
      description: "Machine deleted - no content",
    }
  }
});
