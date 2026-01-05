import { asc, eq } from "drizzle-orm";
import { parseJsonBody, routeFactory, routeResponse } from ".";
import { JobKind, Jobs } from "../db/schema/cam";
import zod from "zod";

const RequestSchema = zod.object({
  machine_id: zod.number(),
  tool_id: zod.number(),
  kind: zod.enum(JobKind.enumValues)
});

export const Request = routeFactory(async (req, authType, tx) => {
  const result = await tx.update(Jobs).set({ status: "in progress" }).where(eq(Jobs.id,
    tx.select({ id: Jobs.id })
      .from(Jobs).where(eq(Jobs.status, "pending"))
      .orderBy(asc(Jobs.created_at))
      .for("update", { skipLocked: true }).limit(1))).returning({ id: Jobs.id });
  if (result.length === 0) return routeResponse(204);
  const [{ id }] = result;
  const job = await tx.query.Jobs.findFirst({ where: eq(Jobs.id, id) });
  if (!job) return routeResponse(204);
  return routeResponse(200, await parseJsonBody(job, RequestSchema));
});

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);

  return await tx.delete(Jobs).where(eq(Jobs.id, id)).returning({ id: Jobs.id });
}, { emailVerifiedNeeded: true });
