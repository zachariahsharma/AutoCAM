import { withAuth } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  getAuthType,
  parseParamId,
  parseJsonBody,
  handleDatabaseError,
  checkAnyChanges,
  validateAuthType
} from "@/lib/api-utils";
import { xid } from "better-auth";

export interface Props {
  params: Promise<{ id: string }>
};

const UpdateInput = zod.object({
  material: zod.string().optional(),
  thickness: zod.number().optional().transform(x => x?.toString()),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  
  const body = await parseJsonBody(await req.json(), UpdateInput);
  if (!body.success) return body.response;

  return withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.update(PartCategories)
      .set(body.data)
      .where(eq(PartCategories.id, id.data))
      .returning({ id: PartCategories.id }));
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
      return checkAnyChanges(await tx.delete(PartCategories)
        .where(eq(PartCategories.id, id.data))
        .returning({ id: PartCategories.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
