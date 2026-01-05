import { BoxTubeJobs, BoxTubes, Jobs } from "@/lib/db/schema/cam";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { CommonAuthorization, Conflict, NotFound, ValidationError } from "../common";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";

const CreateSchema = zod.object({
  machine_id: zod.number(),
  tool_id: zod.number()
})
const Job = createSelectSchema(Jobs).omit({ kind: true, team_id: true }).openapi("Box Tube Job");

registry.registerPath({
  method: "get",
  path: "/api/boxTubes/{id}/jobs",
  tags: ["Box Tube Jobs"],
  summary: "Get Box Tube Jobs",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.jobs.read] }
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
    { [apiKey.name]: [scopes.jobs.create] }
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
      description: "Returns the ID of the created box tube job",
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
  const result = (await tx.query.BoxTubeJobs.findMany({
    where: eq(BoxTubeJobs.box_tube_id, id),
    with: { job: true }
  })).map(x => ({ ...x, ...x.job }));
  return routeResponse(200, await parseJsonBody(result, zod.array(Job)));
});

export const POST = routeFactory(async (req, authType, tx, box_tube_id) => {
  if (!box_tube_id) return routeResponse(422);
  if (!authType.keyDigest) return routeResponse(401);
  const payload = await parseJsonBody(await req.json(), CreateSchema);

  const tube = await tx.query.BoxTubes.findFirst({ where: eq(BoxTubes.id, box_tube_id) });
  if (!tube) return routeResponse(404);

  const [id] = await tx.insert(Jobs).values({
    team_id: tube.team_id,
    kind: "box_tube",
    claimed_by: authType.keyDigest,
    payload: { ...payload, box_tube_id }
  }).returning({ id: Jobs.id });
  await tx.insert(BoxTubeJobs).values({ job_id: id.id, box_tube_id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });