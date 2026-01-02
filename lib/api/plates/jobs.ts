import { PlateJobs } from "@/lib/db/schema/cam";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";
import { CommonAuthorization, Conflict, NotFound, ValidationError } from "../common";

const CreateSchema = createInsertSchema(PlateJobs).omit({ plate_id: true, cam: true, screenshot: true });
const Job = createSelectSchema(PlateJobs).omit({ machine_id: true, plate_id: true, tool_id: true }).openapi("Plate Job")

registry.registerPath({
  method: "get",
  path: "/api/plates/{id}/jobs",
  tags: ["Plate Jobs"],
  summary: "Get Plate Jobs",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.plates.jobs.read] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Plate ID" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the plate jobs for a given plate",
      content: {
        "application/json": {
          schema: zod.array(Job)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/plates/{id}/jobs",
  tags: ["Plate Jobs"],
  summary: "Create Plate Job",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.plates.jobs.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Plate ID" }) }),
    body: {
      content: {
        "application/json": {
          schema: CreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created plate job",
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
  method: "delete",
  path: "/api/plates/jobs/{id}",
  tags: ["Plate Jobs"],
  summary: "Delete Plate Job",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.plates.jobs.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Plate job ID" }) }),
  },
  responses: {
    204: {
      description: "Plate job deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
})

export const GET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return routeResponse(200, await parseJsonBody(await tx.query.PlateJobs.findMany({
    where: eq(PlateJobs.plate_id, id),
  }), zod.array(Job)));
});

export const POST = routeFactory(async (req, authType, tx, plate_id) => {
  if (!plate_id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), CreateSchema);

  const [id] = await tx.insert(PlateJobs).values({ ...body, plate_id }).returning({ id: PlateJobs.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(PlateJobs)
    .where(eq(PlateJobs.id, id))
    .returning({ id: PlateJobs.id });
}, { emailVerifiedNeeded: true });
