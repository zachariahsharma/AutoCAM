import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { eq } from "drizzle-orm";
import { TeamKeys } from "@/lib/schema/entities";
import crypto from "crypto";
import { DatabaseError } from "pg";

export async function GET(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const teamId = Number((await params).id);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse(null, { status: 401 });

  const keys = (await withAuth({ userId: session.user.id }, async tx => {
    return await tx.query.TeamKeys.findMany({
      where: eq(TeamKeys.team_id, teamId),
      columns: { name: true, id: true }
    });
  }));
  return NextResponse.json(keys, { status: 200 });
}

export async function POST(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const team_id = Number((await params).id);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse(null, { status: 401 });
  const name = (await req.formData()).get("name")?.toString();
  if (!name) return new NextResponse(null, { status: 422 });

  const token = crypto.randomBytes(32).toString("hex");

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      await tx.insert(TeamKeys).values({
        digest: crypto.createHmac("sha256", "key").update(token).digest("hex"),
        name, team_id
      });
      return NextResponse.json({ token }, { status: 201 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
