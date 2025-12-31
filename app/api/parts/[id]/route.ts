import { Parts } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import {
  parseJsonBody,
  routeFactory
} from "@/lib/api";
import { PartsUpdateSchema } from "@/lib/api/parts";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), PartsUpdateSchema);
  return await tx.update(Parts)
    .set(body)
    .where(eq(Parts.id, id))
    .returning({ id: Parts.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return await tx.delete(Parts).where(eq(Parts.id, id)).returning({ id: Parts.id });
}, { emailVerifiedNeeded: true });
