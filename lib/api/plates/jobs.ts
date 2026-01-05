import { Jobs, PlateJobs, PlateJobType, Plates } from "@/lib/db/schema/cam";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq, inArray } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";
import { CommonAuthorization, Conflict, NotFound, ValidationError } from "../common";

const CreateSchema = zod.object({
  machine_id: zod.number(),
  tool_id: zod.number(),
  type: zod.enum(PlateJobType.enumValues)
});
const Job = createSelectSchema(Jobs).omit({ kind: true, team_id: true })
  .extend(createSelectSchema(PlateJobs).omit({ plate_id: true, job_id: true })).openapi("Plate Job");

registry.registerPath({
  method: "get",
  path: "/api/plates/{id}/jobs",
  tags: ["Plate Jobs"],
  summary: "Get Plate Jobs",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.jobs.read] }
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
    { [apiKey.name]: [scopes.jobs.create] }
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

export const GET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const result = (await tx.query.PlateJobs.findMany({
    where: eq(PlateJobs.plate_id, id),
    with: { job: true }
  })).map(x => ({ ...x, ...x.job }));
  return routeResponse(200, await parseJsonBody(result, zod.array(Job)));
});

export const POST = routeFactory(async (req, authType, tx, plate_id) => {
  if (!plate_id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), CreateSchema);

  const plate = await tx.query.Plates.findFirst({
    where: eq(Plates.id, plate_id),
    with: { category: true }
  });
  if (!plate) return routeResponse(404);
  // Create generic job
  const [id] = await tx.insert(Jobs).values({
    machine_id: body.machine_id,
    tool_id: body.tool_id,
    team_id: plate.category.team_id,
    kind: "plate"
  }).returning({ id: Jobs.id });
  // Create plate job
  await tx.insert(PlateJobs).values({
    job_id: id.id,
    plate_id,
    type: body.type
  });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });
