import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { eq } from "drizzle-orm";
import { BoxTubeJobs } from "@/lib/db/schema/cam";
import { createInsertSchema } from "drizzle-zod";

export const GET = routeFactory(async (req, authType, tx, id) => {
  return routeResponse(200, await tx.query.BoxTubeJobs.findMany({ where: eq(BoxTubeJobs.box_tube_id, id) }));
});

export const POST = routeFactory(async (req, authType, tx, box_tube_id) => {
  const body = await parseJsonBody({ ...await req.json(), box_tube_id }, createInsertSchema(BoxTubeJobs));
  const [id] = await tx.insert(BoxTubeJobs).values(body).returning({ id: BoxTubeJobs.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });
