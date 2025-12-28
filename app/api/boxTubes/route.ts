import { getAuthType, handleDatabaseError, parseJsonFile, routeResponse, validateAuthType } from "@/lib/api-utils";
import { teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { BoxTubeInsertSchema, BoxTubes } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET() {
  return await getBoxTubes();
}

export async function POST(req: NextRequest) {
  return await createBoxTube(await req.formData());
}

export async function getBoxTubes(teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  return routeResponse(200, await withAuth(authType, async tx => {
    return (await tx.query.BoxTubes.findMany({
      where: eq(BoxTubes.team_id, teamId!),
      columns: {
        id: true,
        epic: true,
        name: true,
        quantity: true
      }
    }))
  }));
}

export async function createBoxTube(formData: FormData, team_id?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType, true);
    if (authType.keyDigest)
      team_id = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  const data = await parseJsonFile(
    formData,
    BoxTubeInsertSchema,
    (data, file) => ({ ...data, file, team_id })
  );
  if (!data.success) return data.response;

  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(BoxTubes).values(data.data).returning({ id: BoxTubes.id });
      return routeResponse(201, id);
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}