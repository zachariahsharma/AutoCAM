import { APIKeyInvalidResponse, auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { TeamKeys, TeamMembers, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

// Create team
export async function POST(req: NextRequest) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const formData = await req.formData();

  const name = formData.get("name")?.toString();
  const teamNumber = formData.get("number")?.toString();

  if (!name || !teamNumber)
    return new NextResponse(null, { status: 422 });

  const session = (await auth.api.getSession({ headers: await headers() }))!;
  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const [team] = await tx.insert(Teams).values({
        name,
        number: Number(teamNumber),
        created_by: session.user.id,
      }).returning({ id: Teams.id });

      // Assign current user to this team
      await tx.insert(TeamMembers).values({
        user_id: session.user.id,
        team_id: team.id,
        admin: true,
      });
      return NextResponse.json({ id: team.id }, { status: 201 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}

export async function GET() {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  if (authType.userId) {
    return await withAuth(authType, async tx => {
      return NextResponse.json(await tx.query.Teams.findMany(), { status: 200 });
    });
  } else if (authType.keyDigest) {
    return await withAuth(authType, async tx => {
      return NextResponse.json(await tx.query.Teams.findFirst(), { status: 200 });
    });
  } else return new NextResponse(null, { status: 401 });
}

export async function PATCH(req: NextRequest) {
  return await updateTeam(await req.formData());
}

export async function updateTeam(data: FormData, teamId?: number) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest(),
  };
  if (authType.userId) {
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (authType.keyDigest) {
    teamId = await teamIdFromDigest(authType.keyDigest);
  } else return new NextResponse(null, { status: 401 });
  if (!teamId) return new NextResponse(null, { status: 401 });
  
  const teamNumber = data.get("number")?.toString();
  return await withAuth(authType, async tx => {
    try {
      const updated = await tx.update(Teams).set({
        name: data.get("name")?.toString(),
        number: teamNumber ? Number(teamNumber) : undefined
      }).where(eq(Teams.id, teamId)).returning({ id: Teams.id });
      if (updated.length === 0) return new NextResponse(null, { status: 404 })
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
