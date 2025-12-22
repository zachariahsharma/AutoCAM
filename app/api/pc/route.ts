import { PartCategory } from "@/app/types";
import { getAuthType, getUserId, requireEmailVerified } from "@/lib/api-utils";
import { auth, AuthType, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod from "zod";

export async function GET(req: NextRequest) {
  return await getPartCategories(req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  return await createPartCategory(await req.json());
}

const SearchParams = zod.object({
  material: zod.string().optional(),
  thickness: zod.coerce.number().positive().optional(),
});

export async function getPartCategories(params: URLSearchParams, teamId?: number) {
  const authType = await getAuthType();
  if (authType.keyDigest) {
    teamId = await teamIdFromDigest(authType.keyDigest);
  } else if (!authType.userId)
    return new NextResponse(null, { status: 401 });
  if (!teamId) return new NextResponse(null, { status: 401 });

  const data = await SearchParams.safeParseAsync({
    material: params.get("material")?.toString(),
    thickness: params.get("thickness")?.toString()
  });
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });
  const partCategories = await withAuth(authType, async tx => {
    return (await tx.query.PartCategories.findMany({
      where: and(
        eq(PartCategories.team_id, teamId),
        data.data.material !== undefined ? eq(PartCategories.material, data.data.material) : undefined,
        data.data.thickness !== undefined ? eq(PartCategories.thickness, data.data.thickness.toString()) : undefined
      ),
      columns: {
        id: true,
        material: true,
        thickness: true,
      }
    })).map(c => ({ ...c, thickness: Number(c.thickness) }));
  });
  return NextResponse.json(partCategories, { status: 200 });
}

const CreateInput = zod.object({
  material: zod.string(),
  thickness: zod.number(),
});

export async function createPartCategory(json: any, team_id?: number) {
  const authType = await getAuthType();
  if (authType.userId) {
    const err = await requireEmailVerified();
    if (err) return err;
  } else if (authType.keyDigest) {
    team_id = await teamIdFromDigest(authType.keyDigest);
  } else return new NextResponse(null, { status: 401 });
  if (!team_id) return new NextResponse(null, { status: 401 });

  const data = await CreateInput.safeParseAsync(json);
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });
  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(PartCategories)
        .values({ ...data.data, team_id, thickness: data.data.thickness.toString() })
        .returning({ id: PartCategories.id });
      return NextResponse.json({ id: id.id }, { status: 201 });
    } catch (err) {
      if (err instanceof DatabaseError) {
        if (err.code === "42501")
          return new NextResponse(null, { status: 403 });
        else if (err.code === "23505")
          return new NextResponse(null, { status: 409 });
      }
      throw err;
    }
  });
}
