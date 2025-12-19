import { EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import db from "@/lib/db";
import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getTeamMember, TeamMemberNotAdmin } from "../route";

export interface Props { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  const team = await db.query.Teams.findFirst({
    where: (table, { eq }) => eq(table.id, teamId),
  });
  if (!team) return new NextResponse(null, { status: 404 });
  return NextResponse.json(team);
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  if (!isEmailVerified(req)) return EmailNotVerifiedResponse;
  const teamMember = await getTeamMember(req, teamId);
  if (!teamMember || !teamMember.admin) return TeamMemberNotAdmin;
  const formData = await req.formData();

  const teamNumber = formData.get("number")?.toString();
  await db.update(Teams).set({
    name: formData.get("name")?.toString(),
    number: teamNumber ? Number(teamNumber) : undefined,
  }).where(eq(Teams.id, teamId));
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  if (!isEmailVerified(req)) return EmailNotVerifiedResponse;
  const teamMember = await getTeamMember(req, teamId);
  if (!teamMember || !teamMember.admin) return TeamMemberNotAdmin;
  await db.delete(Teams).where(eq(Teams.id, teamId));
  return new NextResponse(null, { status: 204 });
}