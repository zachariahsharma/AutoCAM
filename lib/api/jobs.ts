import { asc, eq } from "drizzle-orm";
import { routeFactory, routeResponse } from ".";
import { Jobs } from "../db/schema/cam";

export const Request = routeFactory(async (req, authType, tx) => {
  const job = await tx.query.Jobs.findFirst({
    orderBy: asc(Jobs.created_at),
    with: {
      plate_job: true,
      box_tube_job: true
    }
  });
  console.log(job);
});

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);

  return await tx.delete(Jobs).where(eq(Jobs.id, id)).returning({ id: Jobs.id });
}, { emailVerifiedNeeded: true });
