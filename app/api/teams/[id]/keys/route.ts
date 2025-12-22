import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { eq } from "drizzle-orm";
import { TeamKeys } from "@/lib/schema/entities";
import crypto from "crypto";
import { DatabaseError } from "pg";
import zod from "zod";

export async function GET(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const teamId = await zod.number().safeParseAsync((await params).id);
  if (!teamId.success)
    return NextResponse.json(teamId.error.issues, { status: 422 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse(null, { status: 401 });

  const keys = (await withAuth({ userId: session.user.id }, async tx => {
    return await tx.query.TeamKeys.findMany({
      where: eq(TeamKeys.team_id, teamId.data),
      columns: { name: true, id: true }
    });
  }));
  return NextResponse.json(keys, { status: 200 });
}

const CreateInput = zod.object({
  name: zod.string(),
})

export async function POST(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const teamId = await zod.number().safeParseAsync((await params).id);
  if (!teamId.success)
    return NextResponse.json(teamId.error.issues, { status: 422 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse(null, { status: 401 });
  const data = await CreateInput.safeParseAsync(await req.json());
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });

  const token = crypto.randomBytes(32).toString("hex");

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      await tx.insert(TeamKeys).values({
        digest: crypto.createHmac("sha256", "key").update(token).digest("hex"),
        ...data.data, team_id: teamId.data
      });
      return NextResponse.json({ token }, { status: 201 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}
