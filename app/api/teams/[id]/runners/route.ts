import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import db from "@/lib/db";
import { EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { getTeamMember, TeamMemberNotAdmin } from "../../route";
import { TeamRunners } from "@/lib/schema/entities";
import { getRunnerToken, RunnerTokenInvalid } from "@/app/api/runners/route";
import { and, count, eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  const runners = await db.query.TeamRunners.findMany({
    where: (table, { eq }) => eq(table.team_id, teamId)
  });
  return NextResponse.json(runners, { status: 200 });
}

export async function POST(req: NextRequest, { params }: Props) {
  const team_id = Number((await params).id);
  if (!await isEmailVerified(req)) return EmailNotVerifiedResponse;
  const teamMember = await getTeamMember(req, team_id);
  if (!teamMember || !teamMember.admin) return TeamMemberNotAdmin;

  const name = (await req.formData()).get("name")?.toString();
  if (!name) return new NextResponse(null, { status: 422 });

  const runner = await db.insert(TeamRunners).values({ team_id, name }).returning({ token: TeamRunners.token });
  return NextResponse.json(runner[0], { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  if (!await isEmailVerified(req)) return EmailNotVerifiedResponse;
  const teamMember = await getTeamMember(req, teamId);
  if (!teamMember || !teamMember.admin) return TeamMemberNotAdmin;
  const token = getRunnerToken(req);
  if (!token) return RunnerTokenInvalid;
  const numDeleted = await db.delete(TeamRunners)
    .where(and(eq(TeamRunners.token, token), eq(TeamRunners.team_id, teamId)))
    .returning({ count: count() });
  if (numDeleted[0].count == 0) return RunnerTokenInvalid;
  return new NextResponse(null, { status: 204 });
}
