import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { eq } from "drizzle-orm";
import { PlateJobs } from "@/lib/db/schema/cam";
import { createInsertSchema } from "drizzle-zod";

export const GET = routeFactory(async (req, authType, tx, id) => {
  return routeResponse(200, await tx.query.PlateJobs.findMany({
    where: eq(PlateJobs.plate_id, id),
    columns: {
      id: true,
      status: true,
      screenshot: true,
      cam: true
    }
  }));
});

export const POST = routeFactory(async (req, authType, tx, plate_id) => {
  const body = await parseJsonBody({ ...await req.json(), plate_id }, createInsertSchema(PlateJobs).omit({
    cam: true,
    screenshot: true,
  }));

  const [id] = await tx.insert(PlateJobs).values(body).returning({ id: PlateJobs.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });
