import { withAuth } from "@/lib/db";
import { TeamKeys } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  parseParamId,
  parseJsonBody,
  handleDatabaseError,
  checkAnyChanges,
  getAuthType,
  validateAuthType
} from "@/lib/api-utils";

interface Props {
  params: Promise<{ id: string }>
};

export async function DELETE(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const keyIdResult = await parseParamId((await params).id);
  if (!keyIdResult.success) return keyIdResult.response;
  
  return await withAuth({ userId: authType.userId }, async tx => {
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
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }
  
  const keyIdResult = await parseParamId((await params).id);
  if (!keyIdResult.success) return keyIdResult.response;
  
  const bodyResult = await parseJsonBody(await req.json(), UpdateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth({ userId: authType.userId }, async tx => {
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
