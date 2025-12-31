import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { Material, MaterialsCreateSchema } from "@/lib/api/materials";
import { AuthType, teamIdFromDigest } from "@/lib/auth/server";
import { Transaction } from "@/lib/db";
import { Materials } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import zod from "zod";

export const GET = routeFactory((req, authType, tx) => getMaterials(authType, tx));
export const POST = routeFactory(async (req, authType, tx) => createMaterial(authType, tx, await req.json()))

export async function getMaterials(authType: AuthType, tx: Transaction, teamId?: number) {
  teamId ??= await teamIdFromDigest(tx, authType);
  return routeResponse(200, await parseJsonBody(await tx.query.Materials.findMany({
    where: eq(Materials.team_id, teamId!)
  }), zod.array(Material)));
}

export async function createMaterial(authType: AuthType, tx: Transaction, json: object, team_id?: number) {
  team_id ??= await teamIdFromDigest(tx, authType);

  const body = await parseJsonBody(json, MaterialsCreateSchema);

  const [id] = await tx.insert(Materials).values({ ...body, team_id }).returning({ id: Materials.id });
  return routeResponse(200, id);
}
