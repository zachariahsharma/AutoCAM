import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import db, { withUser } from "@/lib/db";
import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { TeamRunners } from "@/lib/schema/entities";
import { getRunnerDigest, RunnerTokenInvalid } from "@/app/api/runners/route";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { DatabaseError } from "pg";
import { headers } from "next/headers";

export async function GET(req: NextRequest, { params }: Props) {
  const teamId = Number((await params).id);
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const runners = await withUser(session.user.id, async tx => {
    return await tx.query.TeamRunners.findMany({
      where: eq(TeamRunners.team_id, teamId),
      columns: { name: true },
    })
  });
  return NextResponse.json(runners, { status: 200 });
}

export async function POST(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const team_id = Number((await params).id);
  const session = (await auth.api.getSession({ headers: await headers() }))!;

  const name = (await req.formData()).get("name")?.toString();
  if (!name) return new NextResponse(null, { status: 422 });

  const token = crypto.randomUUID();
  const digest = crypto.createHmac("sha256", "key").update(token).digest("hex");

  return await withUser(session.user.id, async tx => {
    try {
      await tx.insert(TeamRunners).values({ team_id, digest, name });
      return NextResponse.json({ token }, { status: 201 });
    } catch (err) {
      if (err instanceof DatabaseError) {
        if (err.code === "23505")
          return new NextResponse(null, { status: 409 });
        else if (err.code === "42501")
          return new NextResponse(null, { status: 403 });
      }
      throw err;
    }
  });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const teamId = Number((await params).id);
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const digest = getRunnerDigest(req);
  if (!digest) return RunnerTokenInvalid;
  return await withUser(session.user.id, async tx => {
    try {
      const numDeleted = await tx.delete(TeamRunners)
        .where(and(eq(TeamRunners.digest, digest), eq(TeamRunners.team_id, teamId)))
        .returning({ name: TeamRunners.name });
      if (numDeleted.length === 0) return RunnerTokenInvalid;
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
