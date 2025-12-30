import { withAuth } from "@/lib/db";
import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import {
  parseParamId,
  handleDatabaseError,
  checkAnyChanges,
  validateAuthType,
  getAuthType,
  parseJsonBody
} from "@/lib/api-utils";
import zod from "zod";

export interface Props { params: Promise<{ id: string }> };

const UpdateInput = zod.object({
  name: zod.string().optional(),
  owner: zod.email().optional(),
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
      return checkAnyChanges(await tx.update(Teams)
        .set(body.data)
        .where(eq(Teams.id, id.data))
        .returning({ id: Teams.id }));
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
      return checkAnyChanges(await tx.delete(Teams)
        .where(eq(Teams.id, id.data))
        .returning({ id: Teams.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}