import db from "@/lib/db";
import { TeamRunners } from "@/lib/db/schema/entities";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const digest = getRunnerDigest(req);
  if (!digest) return RunnerTokenInvalid;
  const runner = await db.query.TeamRunners.findFirst({
    with: { team: true },
    where: eq(TeamRunners.digest, digest)
  });
  // Query jobs from team

  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: NextRequest) {
  const digest = getRunnerDigest(req);
  if (!digest) return RunnerTokenInvalid;
  const data = await req.json();
  // Put this data back into the table and mark it as completed
  return new NextResponse(null, { status: 204 });
}
