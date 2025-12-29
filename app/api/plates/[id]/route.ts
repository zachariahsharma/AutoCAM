import { parseJsonBody, routeFactory } from "@/lib/api-utils";
import { Plates } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), createUpdateSchema(Plates));

  return await tx.update(Plates)
    .set(body)
    .where(eq(Plates.id, id))
    .returning({ id: Plates.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return await tx.delete(Plates)
    .where(eq(Plates.id, id))
    .returning({ id: Plates.id });
}, { emailVerifiedNeeded: true });