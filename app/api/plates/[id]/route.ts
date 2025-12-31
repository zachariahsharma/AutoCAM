import { parseJsonBody, routeFactory } from "@/lib/api";
import { PlatesUpdateSchema } from "@/lib/api/plates";
import { Plates } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), PlatesUpdateSchema);

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