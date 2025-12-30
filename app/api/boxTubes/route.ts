import { getAuthType, handleDatabaseError, parseJsonBody, routeResponse, validateAuthType } from "@/lib/api-utils";
import { teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { BoxTubes } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { NextRequest } from "next/server";

export async function GET() {
  return await getBoxTubes();
}

export async function POST(req: NextRequest) {
  return await createBoxTube(await req.json());
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

export async function createBoxTube(json: any, teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType, true);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  const data = await parseJsonBody({
    ...json,
    team_id: teamId
  }, createInsertSchema(BoxTubes));
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