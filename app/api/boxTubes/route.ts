import { parseJsonFile, routeFactory, routeResponse } from "@/lib/api";
import { AuthType, teamIdFromDigest } from "@/lib/auth/server";
import { Transaction } from "@/lib/db";
import { BoxTubesInsertSchema, BoxTubes } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";

export const GET = routeFactory((req, authType, tx) => getBoxTubes(authType, tx));
export const POST = routeFactory(
  async (req, authType, tx) => createBoxTube(authType, tx, await req.formData()),
  { emailVerifiedNeeded: true }
);

export async function getBoxTubes(authType: AuthType, tx: Transaction, teamId?: number) {
  teamId ??= await teamIdFromDigest(tx, authType);

  return routeResponse(200, await tx.query.BoxTubes.findMany({
      where: eq(BoxTubes.team_id, teamId!),
      columns: {
        id: true,
        epic: true,
        name: true,
        quantity: true
      }
  }));
}

export async function createBoxTube(authType: AuthType, tx: Transaction, formData: FormData, team_id?: number) {
  team_id ??= await teamIdFromDigest(tx, authType);

  const data = await parseJsonFile(
    formData,
    BoxTubesInsertSchema,
    (data, file) => ({ ...data, file, team_id })
  );

  const [id] = await tx.insert(BoxTubes).values(data).returning({ id: BoxTubes.id });
  return routeResponse(201, id);
}