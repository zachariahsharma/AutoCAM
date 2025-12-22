import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  if (authType.userId && !await isEmailVerified())
    return EmailNotVerifiedResponse;

  const formData = await req.formData();
  const categoryId = Number((await params).id);
  return withAuth(authType, async tx => {
    try {
      const categories = await tx.update(PartCategories).set({
        material: formData.get("material")?.toString(),
        thickness: formData.get("thickness")?.toString(),
      }).where(eq(PartCategories.id, categoryId)).returning({ id: PartCategories.id });
      if (categories.length === 0)
        return new NextResponse(null, { status: 404 });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  if (authType.userId && !await isEmailVerified())
    return EmailNotVerifiedResponse;

  const categoryId = Number((await params).id);
  return await withAuth(authType, async tx => {
    try {
      const categories = await tx.delete(PartCategories)
        .where(eq(PartCategories.id, categoryId))
        .returning({ id: PartCategories.id });
      if (categories.length === 0)
        return new NextResponse(null, { status: 404 });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
