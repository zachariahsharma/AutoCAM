import { auth } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { TeamKeys } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  checkAuthWithEmailVerification,
  parseParamId,
  parseJsonBody,
  handleDatabaseError,
  routeResponse,
  getUserId,
  checkAnyChanges
} from "@/lib/api-utils";

interface Props {
  params: Promise<{ id: string }>
};

export async function DELETE(req: NextRequest, { params }: Props) {
  const authError = await checkAuthWithEmailVerification();
  if (authError) return authError;
  
  const keyIdResult = await parseParamId((await params).id);
  if (!keyIdResult.success) return keyIdResult.response;
  
  const userId = await getUserId();
  if (userId === undefined) return routeResponse(401);

  return await withAuth({ userId }, async tx => {
    try {
      return checkAnyChanges(await tx
        .delete(TeamKeys)
        .where(eq(TeamKeys.id, keyIdResult.data))
        .returning({ id: TeamKeys.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

const UpdateInput = zod.object({
  name: zod.string(),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const authError = await checkAuthWithEmailVerification();
  if (authError) return authError;
  
  const keyIdResult = await parseParamId((await params).id);
  if (!keyIdResult.success) return keyIdResult.response;
  
  const userId = await getUserId();
  if (userId === undefined) return routeResponse(401);
  
  const bodyResult = await parseJsonBody(await req.json(), UpdateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth({ userId }, async tx => {
    try {
      return checkAnyChanges(await tx.update(TeamKeys)
        .set(bodyResult.data)
        .where(eq(TeamKeys.id, keyIdResult.data))
        .returning({ id: TeamKeys.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
