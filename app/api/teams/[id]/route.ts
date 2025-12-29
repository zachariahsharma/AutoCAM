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

export interface Params { id: string };

export const PATCH = routeFactory<Params>(async (req, authType, tx, params) => {
  const body = await parseJsonBody(await req.json(), createUpdateSchema(Teams, {
    owner: zod.email().optional()
  }));

  return checkAnyChanges(
    await tx.update(Teams)
      .set(body)
      .where(eq(Teams.id, await parseParamId(params.id)))
      .returning({ id: Teams.id })
  )
}, { emailVerifiedNeeded: true })

export const DELETE = routeFactory<Params>(async (req, authType, tx, params) => {
  return checkAnyChanges(
    await tx.delete(Teams)
      .where(eq(Teams.id, await parseParamId(params.id)))
      .returning({ id: Teams.id })
  )
}, { emailVerifiedNeeded: true });