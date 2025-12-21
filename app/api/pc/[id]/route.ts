import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return await updatePartCategory(await req.formData(), Number((await params).id));
}

export async function updatePartCategory(formData: FormData, categoryId: number, teamId?: number) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  if (authType.userId) {
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (authType.keyDigest) {
    teamId = await teamIdFromDigest(authType.keyDigest);
  } else return new NextResponse(null, { status: 401 });
  if (!teamId) return new NextResponse(null, { status: 401 });

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