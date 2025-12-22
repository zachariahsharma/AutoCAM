import { auth } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { updateTeam } from "../route";
import { 
  parseParamId, 
  checkAuthWithEmailVerification, 
  notFoundResponse, 
  noContentResponse, 
  handleDatabaseError
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
  
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const teamIdResult = await parseParamId((await params).id);
  if (!teamIdResult.success) return teamIdResult.response;
  
  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const deleted = await tx.delete(Teams).where(eq(Teams.id, teamIdResult.data)).returning({ id: Teams.id });
      if (deleted.length === 0) return notFoundResponse();
      return noContentResponse();
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}