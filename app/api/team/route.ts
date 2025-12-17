import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("id");
  if (!teamId) return new NextResponse(null, { status: 422 });
  const team = await db.query.Teams.findFirst({
    where: (table, { eq }) => eq(table.id, Number(teamId)),
  });
  if (!team) return new NextResponse(null, { status: 404 });
  return NextResponse.json(team);
}

// Create team
export async function POST(req: NextRequest) {
  // Comfortable doing assert here because middleware should take care of not signed in users
  const userId = (await auth.api.getSession())!.user.id;
  const formData = await req.formData();
  
  const name = formData.get("name")?.toString();
  const teamNumber = formData.get("number")?.toString();
  
  if (!name || !teamNumber)
    return new NextResponse(null, { status: 422 });
  
  await db.transaction(async tx => {
    const [team] = await tx.insert(Teams).values({
      name,
      number: Number(teamNumber),
    }).returning({ id: Teams.id });
    // Assign current user to this team
    await tx.insert(TeamMembers).values({
      user_id: userId,
      team_id: team.id,
    })
  });
  return new NextResponse(null, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("id");
  if (!teamId) return new NextResponse(null, { status: 422 });
  await db.delete(Teams).where(eq(Teams.id, Number(teamId)));
  return new NextResponse(null, { status: 204 });
}