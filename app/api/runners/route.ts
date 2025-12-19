import db from "@/lib/db";
import { TeamRunners } from "@/lib/schema/entities";
import { count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const RunnerTokenInvalid = new NextResponse(null, { status: 401 });

function getRunnerToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.split("Bearer ")[1];
  return token;
}

export async function DELETE(req: NextRequest) {
  const token = getRunnerToken(req);
  if (!token) return RunnerTokenInvalid;
  const numDeleted = await db.delete(TeamRunners).where(eq(TeamRunners.token, token)).returning({ count: count() });
  if (numDeleted[0].count == 0) return RunnerTokenInvalid;
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const token = getRunnerToken(req);
  if (!token) return RunnerTokenInvalid;
  const runner = await db.query.TeamRunners.findFirst({
    with: { team: true },
    where: (table, {eq}) => eq(table.token, token)
  });
  // Query jobs from team

  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: NextRequest) {
  const token = getRunnerToken(req);
  if (!token) return RunnerTokenInvalid;
  const data = await req.json();
  // Put this data back into the table and mark it as completed
  return new NextResponse(null, { status: 204 });
}
