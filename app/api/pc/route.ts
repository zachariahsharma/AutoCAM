import { PartCategory } from "@/app/types";
import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

export async function GET() {
  return await getPartCategories();
}

export async function POST(req: NextRequest) {
  return await createPartCategory(await req.formData());
}

export async function getPartCategories(teamId?: number) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  if (authType.userId) {}
  else if (authType.keyDigest) {
    teamId = await teamIdFromDigest(authType.keyDigest);
  } else return new NextResponse(null, { status: 401 });
  if (!teamId) return new NextResponse(null, { status: 401 });

  const partCategories = await withAuth(authType, async tx => {
    return await tx.query.PartCategories.findMany();
  });
  return NextResponse.json(partCategories, { status: 200 });
}

export async function createPartCategory(formData: FormData, team_id?: number) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  if (authType.userId) {
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (authType.keyDigest) {
    team_id = await teamIdFromDigest(authType.keyDigest);
  } else return new NextResponse(null, { status: 401 });
  if (!team_id) return new NextResponse(null, { status: 401 });

  const material = formData.get("material")?.toString();
  const thickness = formData.get("thickness")?.toString();
  if (!material || !thickness) return new NextResponse(null, { status: 422 });
  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(PartCategories).values({ material, team_id, thickness }).returning({ id: PartCategories.id });
      return NextResponse.json({ id }, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
