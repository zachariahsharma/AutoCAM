import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod from "zod";

const CreateInput = zod.object({
  name: zod.string(),
  number: zod.coerce.number().positive(),
});

export async function POST(req: NextRequest) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse(null, { status: 401 });

  const data = await CreateInput.safeParseAsync(await req.json());
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const [team] = await tx.insert(Teams).values({
        ...data.data,
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
  return await updateTeam(await req.json());
}

const UpdateInput = zod.object({
  number: zod.coerce.number().positive().optional(),
  name: zod.string().optional(),
});

export async function updateTeam(json: object, teamId?: number) {
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

  const data = await UpdateInput.safeParseAsync(json);
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });

  return await withAuth(authType, async tx => {
    try {
      const updated = await tx.update(Teams)
        .set(data.data)
        .where(eq(Teams.id, teamId))
        .returning({ id: Teams.id });
      if (updated.length === 0) return new NextResponse(null, { status: 404 })
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
