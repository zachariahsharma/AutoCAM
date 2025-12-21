import { auth, AuthType, getKeyDigest, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  return await getPartCategories();
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
