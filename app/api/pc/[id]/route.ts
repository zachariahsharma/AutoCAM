import { PartCategories } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import {
  parseJsonBody,
  routeFactory
} from "@/lib/api";
import { createUpdateSchema } from "drizzle-zod";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), createUpdateSchema(PartCategories));

  return await tx.update(PartCategories)
  .set(body)
  .where(eq(PartCategories.id, id))
  .returning({ id: PartCategories.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return await tx.delete(PartCategories)
    .where(eq(PartCategories.id, id))
    .returning({ id: PartCategories.id });
}, { emailVerifiedNeeded: true });
