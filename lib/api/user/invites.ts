import { createSelectSchema } from "drizzle-zod";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { TeamInvites, TeamMembers } from "@/lib/db/schema/entities";
import zod from "zod";

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { withAuth } from "@/lib/db";
import { headers } from "next/headers";

const Invite = createSelectSchema(TeamInvites).extend({ team: zod.string() });

export const GET = routeFactory(async (req, authType, tx) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return routeResponse(401);
  return routeResponse(200, await parseJsonBody((await tx.query.TeamInvites.findMany({
    with: { team: true },
    where: eq(TeamInvites.email, session.user.email)
  })).map(x => ({ ...x, team: x.team.name })), zod.array(Invite)))
});

export const Accept = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const inviteId = (await params).id;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return routeResponse(401, { message: "User session not found" });
  
  // Check if this is an API call (wants JSON) or a direct link visit (wants redirect)
  const acceptHeader = req.headers.get("accept") || "";
  const wantsJson = acceptHeader.includes("application/json");
  
  return withAuth({ userId: session.user.id }, async tx => {
    const invite = await tx.query.TeamInvites.findFirst({
      where: eq(TeamInvites.id, inviteId)
    });
    if (!invite) return routeResponse(404);
    if (session.user.email !== invite.email) return routeResponse(403, { message: "User email does not match invite email" });

    const deleted = await tx
      .delete(TeamInvites)
      .where(eq(TeamInvites.id, inviteId))
      .returning({ id: TeamInvites.id });
    if (deleted.length === 0) return routeResponse(403, { message: "Unable to accept invite" });

    await tx.insert(TeamMembers).values({
      team_id: invite.team_id,
      user_id: session.user.id,
      admin: invite.admin
    }).onConflictDoNothing({ target: [TeamMembers.team_id, TeamMembers.user_id] });

    // If called via fetch (API call), return JSON with team_id
    if (wantsJson) {
      return routeResponse(200, { team_id: invite.team_id });
    }
    
    // If accessed directly (email link), redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  });
}
