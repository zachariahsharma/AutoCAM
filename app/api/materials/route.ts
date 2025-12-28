import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api-utils";
import { AuthType, teamIdFromDigest } from "@/lib/auth";
import { Transaction } from "@/lib/db";
import { Materials } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const GET = routeFactory((req, authType, tx) => getMaterials(authType, tx));
export const POST = routeFactory(async (req, authType, tx) => createMaterial(authType, tx, await req.json()))

export async function getMaterials(authType: AuthType, tx: Transaction, teamId?: number) {
  if (authType.keyDigest)
    teamId = await teamIdFromDigest(tx, authType.keyDigest);
  return routeResponse(200, await tx.query.Materials.findMany({
    columns: { id: true, name: true },
    where: eq(Materials.team_id, teamId!)
  }));
}

export async function createMaterial(authType: AuthType, tx: Transaction, json: object, team_id?: number) {
  if (authType.keyDigest)
    team_id = await teamIdFromDigest(tx, authType.keyDigest);

  const body = await parseJsonBody({ ...json, team_id }, createInsertSchema(Materials));

  const [id] = await tx.insert(Materials).values(body).returning({ id: Materials.id });
  return routeResponse(200, id);
}
