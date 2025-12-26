import { getAuthType, routeResponse, validateAuthType } from "@/lib/api-utils";
import { teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { BoxTubes } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";

export async function GET() {
  return await getBoxTubes();
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