import { routeFactory } from "@/lib/api";
import { PlateJobs } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return await tx.delete(PlateJobs)
    .where(eq(PlateJobs.id, id))
    .returning({ id: PlateJobs.id });
});