import { checkAnyChanges, getAuthType, handleDatabaseError, parseJsonBody, parseParamId, validateAuthType } from "@/lib/api-utils";
import { withAuth } from "@/lib/db";
import { Plates } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";

export interface Props {
  params: Promise<{ id: string }>
};

const UpdateInput = zod.object({
  width: zod.number().optional().transform(x => x?.toString()),
  length: zod.number().optional().transform(x => x?.toString()),
  trueDepth: zod.number().optional().transform(x => x?.toString()),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;

  const body = await parseJsonBody(await req.json(), UpdateInput);
  if (!body.success) return body.response;

  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.update(Plates)
        .set(body.data)
        .where(eq(Plates.id, id.data))
        .returning({ id: Plates.id }));
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
      return checkAnyChanges(await tx.delete(Plates)
        .where(eq(Plates.id, id.data))
        .returning({ id: Plates.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}