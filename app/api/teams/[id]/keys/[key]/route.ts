import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { TeamKeys } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const keyId = Number((await params).key);
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;

  return await withUser(session.user.id, async tx => {
    try {
      await tx.delete(TeamKeys).where(eq(TeamKeys.id, keyId));
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
