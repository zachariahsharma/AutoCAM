import db from "@/lib/db";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const RunnerTokenInvalid = new NextResponse(null, { status: 401 });
export function getRunnerDigest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.split("Bearer ")[1];
  // TODO: Switch to binary/bytea if better-auth supports a higher drizzle version that adds the bytea PG type
  return crypto.createHmac("sha256", "key").update(token).digest("hex");
}

export async function GET(req: NextRequest) {
  const digest = getRunnerDigest(req);
  if (!digest) return RunnerTokenInvalid;
  const runner = await db.query.TeamRunners.findFirst({
    with: { team: true },
    where: (table, { eq }) => eq(table.digest, digest)
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
