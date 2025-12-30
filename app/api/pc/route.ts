import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api-utils";
import { AuthType, teamIdFromDigest } from "@/lib/auth";
import { Transaction } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import zod from "zod";

export const GET = routeFactory((req, authType, tx) => getPartCategories(authType, tx, req.nextUrl.searchParams));
export const POST = routeFactory(
  async (req, authType, tx) => createPartCategory(tx, await req.json()),
  { emailVerifiedNeeded: true }
);

const SearchParams = zod.object({
  material: zod.string().optional(),
  thickness: zod.coerce.number().positive().optional(),
});

export async function getPartCategories(authType: AuthType, tx: Transaction, params: URLSearchParams, teamId?: number) {
  if (authType.keyDigest)
    teamId = await teamIdFromDigest(tx, authType.keyDigest);

  const data = await parseJsonBody({
    material: params.get("material")?.toString(),
    thickness: params.get("thickness")?.toString()
  }, SearchParams);
  return routeResponse(200, await tx.query.PartCategories.findMany({
    where: and(
      eq(PartCategories.team_id, teamId!),
      data.material !== undefined ? eq(PartCategories.material, data.material) : undefined,
      data.thickness ? eq(PartCategories.thickness, data.thickness) : undefined
    ),
    columns: {
      id: true,
      material: true,
      thickness: true,
    }
  }));
}

export async function createPartCategory(tx: Transaction, json: any, team_id?: number) {
  const data = await parseJsonBody({ ...json, team_id }, createInsertSchema(PartCategories));
  const [id] = await tx.insert(PartCategories).values(data).returning({ id: PartCategories.id });
  return routeResponse(201, id);
}
