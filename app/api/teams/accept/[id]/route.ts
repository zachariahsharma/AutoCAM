import { getUserId, routeResponse } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { TeamInvites, TeamMembers } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const inviteId = (await params).id;
  const invite = await db.query.TeamInvites.findFirst({
    where: eq(TeamInvites.id, inviteId)
  });
  if (!invite) return routeResponse(404);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return routeResponse(401);
  if (session.user.email !== invite.email) return routeResponse(403);

  // User is now authorized to join the team
  await db.transaction(async tx => {
    await tx.delete(TeamInvites).where(eq(TeamInvites.id, inviteId));
    await tx.insert(TeamMembers).values({
      team_id: invite.team_id,
      user_id: session.user.id,
      // TODO: This shouldn't be hardcoded
      admin: false,
    });
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}