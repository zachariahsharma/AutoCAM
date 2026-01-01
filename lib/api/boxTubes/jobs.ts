import { BoxTubeJobs } from "@/lib/db/schema/cam";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";

const CreateSchema = createInsertSchema(BoxTubeJobs).omit({ box_tube_id: true });
const Job = createSelectSchema(BoxTubeJobs).omit({ box_tube_id: true, machine_id: true, tool_id: true });

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