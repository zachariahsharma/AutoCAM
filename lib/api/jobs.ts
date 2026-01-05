import { asc, eq } from "drizzle-orm";
import { routeFactory, routeResponse } from ".";
import { JobKind, Jobs, PlateJobType } from "../db/schema/cam";
import zod from "zod";

const RequestSchema = zod.object({
  tool: zod.httpUrl(),
  machine: zod.httpUrl(),
  details: zod.discriminatedUnion("kind", [
    zod.object({
      kind: zod.literal("plate"),
      type: zod.enum(PlateJobType.enumValues),
      parts: zod.array(zod.object({
        part: zod.httpUrl(),
        quantity: zod.number()
      }))
    }),
    zod.object({
      kind: zod.literal("box_tube"),
      box_tube: zod.httpUrl()
    })
  ])
});

export const Request = routeFactory(async (req, authType, tx) => {
  const result = await tx.update(Jobs).set({ status: "in progress" }).where(eq(Jobs.id,
    tx.select({ id: Jobs.id })
      .from(Jobs).where(eq(Jobs.status, "pending"))
      .orderBy(asc(Jobs.created_at))
      .for("update", { skipLocked: true }).limit(1))).returning({ id: Jobs.id });
  if (result.length === 0) return routeResponse(204);
  const [{ id }] = result;
  const job = await tx.query.Jobs.findFirst({
    where: eq(Jobs.id, id),
    with: {
      plate_job: {
        with: {
          plate: {
            with: {
              category: true
            }
          }
        }
      },
      box_tube_job: true
    }
  });
  console.log(job);
});

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);

  return await tx.delete(Jobs).where(eq(Jobs.id, id)).returning({ id: Jobs.id });
}, { emailVerifiedNeeded: true });
