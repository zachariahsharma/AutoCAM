import crypto from "crypto";
import { eq } from "drizzle-orm";
import { TeamKeys } from "@/lib/db/schema/entities";
import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { createInsertSchema } from "drizzle-zod";

export const GET = routeFactory(async (req, authType, tx, id) => {
  return routeResponse(200, await tx.query.TeamKeys.findMany({
    where: eq(TeamKeys.team_id, id),
    columns: { name: true, id: true, scopes: true }
  }));
}, { emailVerifiedNeeded: true });

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  const token = crypto.randomBytes(32).toString("hex");
  const body = await parseJsonBody({
    ...await req.json(), team_id,
    digest: crypto.createHmac("sha256", "key").update(token).digest("hex"),
  }, createInsertSchema(TeamKeys));

  await tx.insert(TeamKeys).values(body);
  return routeResponse(201, { token });
}, { emailVerifiedNeeded: true });
