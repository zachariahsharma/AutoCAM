import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import {
  parseParamId,
  checkAnyChanges,
  parseJsonBody,
  routeFactory
} from "@/lib/api-utils";
import zod from "zod";
import { createUpdateSchema } from "drizzle-zod";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), createUpdateSchema(Teams, {
    owner: zod.email().optional()
  }));

  return checkAnyChanges(
    await tx.update(Teams)
      .set(body)
      .where(eq(Teams.id, id))
      .returning({ id: Teams.id })
  )
}, { emailVerifiedNeeded: true })

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return checkAnyChanges(
    await tx.delete(Teams)
      .where(eq(Teams.id, id))
      .returning({ id: Teams.id })
  )
}, { emailVerifiedNeeded: true });