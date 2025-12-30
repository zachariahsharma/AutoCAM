import { routeResponse } from "@/lib/api";
import { auth } from "@/lib/auth/server";
import db from "@/lib/db";
import { TeamInvites, TeamMembers } from "@/lib/db/schema/entities";
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
    const [admin] = await tx.delete(TeamInvites).where(eq(TeamInvites.id, inviteId)).returning({ admin: TeamInvites.admin });
    await tx.insert(TeamMembers).values({
      team_id: invite.team_id,
      user_id: session.user.id,
      admin: admin.admin,
    });
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}