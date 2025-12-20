import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema/entities";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

// Create team
export async function POST(req: NextRequest) {
  // Comfortable doing assert here because middleware should take care of not signed in users
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const formData = await req.formData();
  
  const name = formData.get("name")?.toString();
  const teamNumber = formData.get("number")?.toString();
  
  if (!name || !teamNumber)
    return new NextResponse(null, { status: 422 });
  
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  return await withUser(session.user.id, async tx => {
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
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  return await withUser(session.user.id, async tx => {
    return NextResponse.json(await tx.query.Teams.findMany(), { status: 200 });
  });
}
