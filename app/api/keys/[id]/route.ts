import { withAuth } from "@/lib/db";
import { TeamKeys } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import {
  parseParamId,
  parseJsonBody,
  handleDatabaseError,
  checkAnyChanges,
  getAuthType,
  validateAuthType
} from "@/lib/api-utils";
import { createUpdateSchema } from "drizzle-zod";

interface Props {
  params: Promise<{ id: string }>
};

export async function DELETE(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  
  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx
        .delete(TeamKeys)
        .where(eq(TeamKeys.id, id.data))
        .returning({ id: TeamKeys.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }
  
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  
  const body = await parseJsonBody(await req.json(), createUpdateSchema(TeamKeys));
  if (!body.success) return body.response;

  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.update(TeamKeys)
        .set(body.data)
        .where(eq(TeamKeys.id, id.data))
        .returning({ id: TeamKeys.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
