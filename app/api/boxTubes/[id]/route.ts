import { checkAnyChanges, getAuthType, handleDatabaseError, parseJsonBody, parseParamId, validateAuthType } from "@/lib/api-utils";
import { withAuth } from "@/lib/db";
import { BoxTubes } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import { NextRequest } from "next/server";

export interface Props {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;

  const body = await parseJsonBody(await req.json(), createUpdateSchema(BoxTubes))
  if (!body.success) return body.response;

  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.update(BoxTubes)
        .set(body.data)
        .where(eq(BoxTubes.id, id.data))
        .returning({ id: BoxTubes.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;

  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx
        .delete(BoxTubes)
        .where(eq(BoxTubes.id, id.data))
        .returning({ id: BoxTubes.id })
      );
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}