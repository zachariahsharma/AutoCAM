import { checkAnyChanges, getAuthType, handleDatabaseError, parseParamId, validateAuthType } from "@/lib/api-utils";
import { BoxTubeJobs } from "@/lib/schema/cam";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/db";
import { eq } from "drizzle-orm";

interface Props {
  params: Promise<{ id: string }>
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;

  return await withAuth(authType, async tx => {
    try {
      return checkAnyChanges(await tx.delete(BoxTubeJobs).where(eq(BoxTubeJobs.id, id.data)).returning({ id: BoxTubeJobs.id }));
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}