import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { Parts } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod from "zod";

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
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };

  if (authType.userId) {
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (!authType.keyDigest)
    return new NextResponse(null, { status: 401 });

  const partId = await zod.number().safeParseAsync((await params).id);
  if (!partId.success)
    return NextResponse.json(partId.error.issues, { status: 422 });
  const data = await UpdateInput.safeParseAsync(await req.json());
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });

  return await withAuth(authType, async tx => {
    try {
      const updated = await tx.update(Parts).set(data.data).returning({ id: Parts.id });
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

export async function DELETE(req: NextRequest, { params }: Props) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };

  if (authType.userId) {
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (!authType.keyDigest)
    return new NextResponse(null, { status: 401 });

  const partId = await zod.number().safeParseAsync((await params).id);
  if (!partId.success)
    return NextResponse.json(partId.error.issues, { status: 422 });

  return withAuth(authType, async tx => {
    try {
      const deleted = await tx.delete(Parts).where(eq(Parts.id, partId.data)).returning({ id: Parts.id });
      if (deleted.length === 0)
        return new NextResponse(null, { status: 404 });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code)
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}