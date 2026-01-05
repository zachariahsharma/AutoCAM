import { eq } from "drizzle-orm";
import { routeFactory, routeResponse } from ".";
import { Jobs } from "../db/schema/cam";

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);

  return await tx.delete(Jobs).where(eq(Jobs.id, id)).returning({ id: Jobs.id });
}, { emailVerifiedNeeded: true });