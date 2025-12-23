import { getAuthType, handleDatabaseError, parseJsonBody, routeResponse, validateAuthType } from "@/lib/api-utils";
import { teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";

export async function GET(req: NextRequest) {
  return await getPartCategories(req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  return await createPartCategory(await req.json());
}

const SearchParams = zod.object({
  material: zod.string().optional(),
  thickness: zod.coerce.number().positive().optional().transform(x => x ? x.toString() : undefined),
});

export async function getPartCategories(params: URLSearchParams, teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  }
  catch (err) { return err; }

  const data = await parseJsonBody({
    material: params.get("material")?.toString(),
    thickness: params.get("thickness")?.toString()
  }, SearchParams);
  if (!data.success) return data.response;
  const partCategories = await withAuth(authType, async tx => {
    return (await tx.query.PartCategories.findMany({
      where: and(
        eq(PartCategories.team_id, teamId!),
        data.data.material !== undefined ? eq(PartCategories.material, data.data.material) : undefined,
        data.data.thickness ? eq(PartCategories.thickness, data.data.thickness) : undefined
      ),
      columns: {
        id: true,
        material: true,
        thickness: true,
      }
    })).map(c => ({ ...c, thickness: Number(c.thickness) }));
  });
  return routeResponse(200, partCategories);
}

const CreateInput = zod.object({
  material: zod.string(),
  thickness: zod.number().transform(x => x.toString()),
});

export async function createPartCategory(json: any, teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType, true);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  const data = await parseJsonBody(json, CreateInput);
  if (!data.success)
    return data.response;
  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(PartCategories)
        .values({ ...data.data, team_id: teamId! })
        .returning({ id: PartCategories.id });
      return routeResponse(201, { id: id.id });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
