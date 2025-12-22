import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { TeamKeys } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod from "zod";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const keyId = await zod.number().safeParseAsync((await params).key);
  if (!keyId.success)
    return NextResponse.json(keyId.error.issues, { status: 422 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse(null, { status: 401 });

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const deleted = await tx
        .delete(TeamKeys)
        .where(eq(TeamKeys.id, keyId.data))
        .returning({ id: TeamKeys.id });
      if (deleted.length === 0) return new NextResponse(null, { status: 404 });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}

const UpdateInput = zod.object({
  name: zod.string(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const keyId = Number((await params).key);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse(null, { status: 401 });
  const data = await UpdateInput.safeParseAsync(await req.json());
  if (!data.success) return NextResponse.json(data.error.issues, { status: 422 });

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const updated = await tx.update(TeamKeys)
        .set({ ...data.data })
        .where(eq(TeamKeys.id, keyId))
        .returning({ id: TeamKeys.id });
      if (updated.length === 0)
        return new NextResponse(null, { status: 404 });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
