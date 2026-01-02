import { BoxTubeJobs } from "@/lib/db/schema/cam";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { CommonAuthorization, Conflict, NotFound, ValidationError } from "../common";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";

const CreateSchema = createInsertSchema(BoxTubeJobs).omit({ box_tube_id: true });
const Job = createSelectSchema(BoxTubeJobs).omit({ box_tube_id: true, machine_id: true, tool_id: true }).openapi("Box Tube Job");

registry.registerPath({
  method: "get",
  path: "/api/boxTubes/{id}/jobs",
  tags: ["Box Tube Jobs"],
  summary: "Get Box Tube Jobs",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.boxTubes.jobs.read] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Box tube ID" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the box tube jobs for a given box tube",
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
  path: "/api/boxTubes/{id}/jobs",
  tags: ["Box Tube Jobs"],
  summary: "Create Box Tube Job",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.boxTubes.jobs.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Box tube ID" }) }),
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
      description: "Returns the ID of the created box tube",
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
  path: "/api/boxTubes/jobs/{id}",
  tags: ["Box Tube Jobs"],
  summary: "Delete Box Tube Job",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.boxTubes.jobs.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "Box tube job ID" }) })
  },
  responses: {
    204: {
      description: "Box tube job deleted successfully"
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
})

export const GET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return routeResponse(200, await parseJsonBody(await tx.query.BoxTubeJobs.findMany({ where: eq(BoxTubeJobs.box_tube_id, id) }), zod.array(Job)));
});

export const POST = routeFactory(async (req, authType, tx, box_tube_id) => {
  if (!box_tube_id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), CreateSchema);
  const [id] = await tx.insert(BoxTubeJobs).values({ ...body, box_tube_id }).returning({ id: BoxTubeJobs.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(BoxTubeJobs).where(eq(BoxTubeJobs.id, id)).returning({ id: BoxTubeJobs.id })
}, { emailVerifiedNeeded: true });