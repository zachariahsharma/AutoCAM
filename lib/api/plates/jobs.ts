import { PlateJobs } from "@/lib/db/schema/cam";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";

const CreateSchema = createInsertSchema(PlateJobs).omit({ plate_id: true, cam: true, screenshot: true });
const Job = createSelectSchema(PlateJobs).omit({ machine_id: true, plate_id: true, tool_id: true })

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
