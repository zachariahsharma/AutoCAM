import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import db from "@/lib/db";
import { EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { getTeamMember, TeamMemberNotAdmin } from "../../route";
import { TeamRunners } from "@/lib/schema/entities";
import { getRunnerDigest, RunnerTokenInvalid } from "@/app/api/runners/route";
import { and, DrizzleError, eq } from "drizzle-orm";
import crypto from "crypto";
import { DatabaseError } from "pg";

export async function GET(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  const runners = await db.query.TeamRunners.findMany({
    where: (table, { eq }) => eq(table.team_id, teamId),
    columns: { name: true }
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

  const token = crypto.randomUUID();
  const digest = crypto.createHmac("sha256", "key").update(token).digest("hex");

  try {
    await db.insert(TeamRunners).values({ team_id, digest, name });
  } catch (err) {
    if (err instanceof DatabaseError && err.code === "23505") {
      return new NextResponse(null, { status: 409 });
    } else throw err;
  }
  return NextResponse.json({ token }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  if (!await isEmailVerified(req)) return EmailNotVerifiedResponse;
  const teamMember = await getTeamMember(req, teamId);
  if (!teamMember || !teamMember.admin) return TeamMemberNotAdmin;
  const digest = getRunnerDigest(req);
  if (!digest) return RunnerTokenInvalid;
  const numDeleted = await db.delete(TeamRunners)
    .where(and(eq(TeamRunners.digest, digest), eq(TeamRunners.team_id, teamId)))
    .returning({ token: TeamRunners.digest });
  if (numDeleted.length === 0) return RunnerTokenInvalid;
  return new NextResponse(null, { status: 204 });
}
