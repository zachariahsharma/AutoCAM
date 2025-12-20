import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import db, { withUser } from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema/entities";
import { and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

export const TeamMemberNotAdmin = new Response(null, { status: 403 });

export async function getTeamMember(req: NextRequest, id: number) {
  const session = (await auth.api.getSession({ headers: req.headers }));
  if (!session) return null;
  const teamMember = await db.query.TeamMembers.findFirst({
    with: { team: true },
    where: (table, { eq }) => and(eq(table.team_id, id), eq(table.user_id, session.user.id))
  });
  return teamMember;
}

// Create team
export async function POST(req: NextRequest) {
  // Comfortable doing assert here because middleware should take care of not signed in users
  const session = (await auth.api.getSession({ headers: req.headers }))!;
  const formData = await req.formData();

  const name = formData.get("name")?.toString();
  const teamNumber = formData.get("number")?.toString();

  if (!name || !teamNumber)
    return new NextResponse(null, { status: 422 });

  return withUser(session.user.id, async tx => {
    try {
      const [team] = await tx.insert(Teams).values({
        name,
        number: Number(teamNumber),
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

export async function GET(req: NextRequest) {
  const session = (await auth.api.getSession())!;
  const teamsMembers = await db.query.TeamMembers.findMany({
    with: { team: true },
    where: (table, { eq }) => eq(table.user_id, session.user.id)
  });
  return NextResponse.json(teamsMembers.map(m => m.team), { status: 200 });
}
