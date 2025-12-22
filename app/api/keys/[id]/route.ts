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
  routeResponse
} from "@/lib/api-utils";

interface Props {
  params: Promise<{ id: string }>
};

export async function DELETE(req: NextRequest, { params }: Props) {
  const authError = await checkAuthWithEmailVerification();
  if (authError) return authError;
  
  const keyIdResult = await parseParamId((await params).id);
  if (!keyIdResult.success) return keyIdResult.response;
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return routeResponse(401);

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const deleted = await tx
        .delete(TeamKeys)
        .where(eq(TeamKeys.id, keyIdResult.data))
        .returning({ id: TeamKeys.id });
      if (deleted.length === 0) return routeResponse(404);
      return routeResponse(204);
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
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return routeResponse(401);
  
  const bodyResult = await parseJsonBody(await req.json(), UpdateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const updated = await tx.update(TeamKeys)
        .set(bodyResult.data)
        .where(eq(TeamKeys.id, keyIdResult.data))
        .returning({ id: TeamKeys.id });
      if (updated.length === 0) return routeResponse(404);
      return routeResponse(204);
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
