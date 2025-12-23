import { withAuth } from "@/lib/db";
import { Parts } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  getAuthType,
  parseParamId,
  parseJsonBody,
  requireEmailVerified,
  handleDatabaseError,
  routeResponse,
  checkAnyChanges,
  validateAuthType
} from "@/lib/api-utils";

interface Props {
  params: Promise<{ id: string }>
};

const UpdateInput = zod.object({
  epic: zod.string().optional(),
  name: zod.string().optional(),
  quantity: zod.number().optional(),
  ticket: zod.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { validateAuthType(authType); }
  catch (err) { return err; }

  if (authType.userId) {
    const emailError = await requireEmailVerified();
    if (emailError) return emailError;
  } else if (!authType.keyDigest) {
    return routeResponse(401);
  }

  const partIdResult = await parseParamId((await params).id);
  if (!partIdResult.success) return partIdResult.response;
  
  const bodyResult = await parseJsonBody(await req.json(), UpdateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.update(Parts).set(bodyResult.data).returning({ id: Parts.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { validateAuthType(authType); }
  catch (err) { return err; }

  if (authType.userId) {
    const emailError = await requireEmailVerified();
    if (emailError) return emailError;
  } else if (!authType.keyDigest) {
    return routeResponse(401);
  }

  const partIdResult = await parseParamId((await params).id);
  if (!partIdResult.success) return partIdResult.response;

  return withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.delete(Parts).where(eq(Parts.id, partIdResult.data)).returning({ id: Parts.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}