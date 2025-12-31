import crypto from "crypto";
import { eq } from "drizzle-orm";
import { TeamKeys } from "@/lib/db/schema/entities";
import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { Key, KeysCreateSchema } from "@/lib/api/teams/keys";
import zod from "zod";

export const GET = routeFactory(async (req, authType, tx, id) => {
  return routeResponse(200, await parseJsonBody(await tx.query.TeamKeys.findMany({
    where: eq(TeamKeys.team_id, id),
  }), zod.array(Key)));
}, { emailVerifiedNeeded: true });

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  const token = crypto.randomBytes(32).toString("hex");
  const body = await parseJsonBody(await req.json(), KeysCreateSchema);

  await tx.insert(TeamKeys).values({
    ...body, team_id,
    digest: crypto.createHmac("sha256", "key").update(token).digest("hex")
  });
  return routeResponse(201, { token });
}, { emailVerifiedNeeded: true });
