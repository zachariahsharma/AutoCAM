import { TeamKeys } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import {
  parseJsonBody,
  routeFactory
} from "@/lib/api-utils";
import { createUpdateSchema } from "drizzle-zod";

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return await tx.delete(TeamKeys)
    .where(eq(TeamKeys.id, id))
    .returning({ id: TeamKeys.id });
}, { emailVerifiedNeeded: true });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), createUpdateSchema(TeamKeys));
  return await tx.update(TeamKeys)
    .set(body)
    .where(eq(TeamKeys.id, id))
    .returning({ id: TeamKeys.id })
}, { emailVerifiedNeeded: true })
