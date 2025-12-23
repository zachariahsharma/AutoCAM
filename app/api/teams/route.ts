import { teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  getAuthType,
  parseJsonBody,
  handleDatabaseError,
  routeResponse,
  checkAnyChanges,
  validateAuthType
} from "@/lib/api-utils";

const CreateInput = zod.object({
  name: zod.string(),
  number: zod.coerce.number().positive(),
});

export async function POST(req: NextRequest) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const bodyResult = await parseJsonBody(await req.json(), CreateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth({ userId: authType.userId }, async tx => {
    try {
      const [team] = await tx.insert(Teams).values({
        ...bodyResult.data,
        created_by: authType.userId!,
      }).returning({ id: Teams.id });

      // Assign current user to this team
      await tx.insert(TeamMembers).values({
        user_id: authType.userId!,
        team_id: team.id,
        admin: true,
      });
      return routeResponse(201, { id: team.id });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function GET() {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }
  return await withAuth(authType, async tx => {
    if (authType.userId)
      return routeResponse(200, await tx.query.Teams.findMany());
    else if (authType.keyDigest)
      return routeResponse(200, await tx.query.Teams.findFirst());
  });
}

export async function PATCH(req: NextRequest) {
  return await updateTeam(await req.json());
}

const UpdateInput = zod.object({
  number: zod.coerce.number().positive().optional(),
  name: zod.string().optional(),
});

export async function updateTeam(json: object, teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  const bodyResult = await parseJsonBody(json, UpdateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.update(Teams)
        .set(bodyResult.data)
        .where(eq(Teams.id, teamId!))
        .returning({ id: Teams.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
