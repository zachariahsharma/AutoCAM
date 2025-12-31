import { Teams } from "@/lib/db/schema/entities";
import { eq } from "drizzle-orm";
import {
  parseJsonBody,
  routeFactory,
  routeResponse
} from "@/lib/api";
import zod from "zod";
import { user } from "@/lib/db/schema/auth";
import { TeamsUpdateSchema } from "@/lib/api/teams";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), TeamsUpdateSchema.extend({
    owner: zod.email().optional().transform(async owner => {
      if (!owner) return;
      const newOwner = await tx.query.user.findFirst({ where: eq(user.email, owner) });
      if (!newOwner) throw routeResponse(404);
      return newOwner.id;
    })
  }));

  return await tx.update(Teams)
    .set(body)
    .where(eq(Teams.id, id))
    .returning({ id: Teams.id });
}, { emailVerifiedNeeded: true })

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  return await tx.delete(Teams)
    .where(eq(Teams.id, id))
    .returning({ id: Teams.id });
}, { emailVerifiedNeeded: true });