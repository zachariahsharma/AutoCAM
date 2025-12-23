import { withAuth } from "@/lib/db";
import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { updateTeam } from "../route";
import {
  parseParamId,
  checkAuthWithEmailVerification,
  handleDatabaseError,
  getUserId,
  checkAnyChanges
} from "@/lib/api-utils";

export interface Props { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const teamIdResult = await parseParamId((await params).id);
  if (!teamIdResult.success) return teamIdResult.response;
  return await updateTeam(await req.json(), teamIdResult.data);
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const authError = await checkAuthWithEmailVerification();
  if (authError) return authError;

  const userId = await getUserId();
  const teamIdResult = await parseParamId((await params).id);
  if (!teamIdResult.success) return teamIdResult.response;

  return await withAuth({ userId }, async tx => {
    try {
      return checkAnyChanges(await tx.delete(Teams)
        .where(eq(Teams.id, teamIdResult.data))
        .returning({ id: Teams.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}