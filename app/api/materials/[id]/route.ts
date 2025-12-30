import { parseJsonBody, routeFactory } from "@/lib/api";
import { Materials } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), createUpdateSchema(Materials));

  return await tx.update(Materials).set(body).where(eq(Materials.id, id));
});

export const DELETE = routeFactory(
  (req, authType, tx, id) => tx.delete(Materials).where(eq(Materials.id, id))
);