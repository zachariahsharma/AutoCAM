import { routeFactory } from "@/lib/api";
import { BoxTubeJobs } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return await tx.delete(BoxTubeJobs).where(eq(BoxTubeJobs.id, id)).returning({ id: BoxTubeJobs.id })
}, { emailVerifiedNeeded: true });