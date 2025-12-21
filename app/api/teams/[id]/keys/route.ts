import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { eq } from "drizzle-orm";
import { TeamKeys } from "@/lib/schema/entities";

export async function GET(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const teamId = Number((await params).id);
  const session = (await auth.api.getSession({ headers: await headers() }))!;

  const keys = (await withUser(session.user.id, async tx => {
    return await tx.query.TeamKeys.findMany({
      where: eq(TeamKeys.team_id, teamId),
      columns: { name: true, id: true }
    });
  }));
  return NextResponse.json(keys, { status: 200 });
}
