import { createSelectSchema } from "drizzle-zod";
import { getAuthType, parseJsonBody, routeFactory, routeResponse } from "..";
import { TeamInvites, TeamMembers } from "@/lib/db/schema/entities";
import zod from "zod";

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import db, { withAuth } from "@/lib/db";
import { headers } from "next/headers";

const Invite = createSelectSchema(TeamInvites).extend({ team: zod.string() });

export const GET = routeFactory(async (req, authType, tx) => {
  return routeResponse(200, await parseJsonBody((await tx.query.TeamInvites.findMany({
    with: { team: true },
  })).map(x => ({ ...x, team: x.team.name })), zod.array(Invite)))
});

export const Accept = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const authType = await getAuthType();
  const inviteId = (await params).id;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return routeResponse(401, { message: "User session not found" });
  return await withAuth(authType, async tx => {
    const invite = await tx.query.TeamInvites.findFirst({
      where: eq(TeamInvites.id, inviteId)
    });
    if (!invite) return routeResponse(404);
    if (session.user.email !== invite.email) return routeResponse(403, { message: "User email does not match invite email" });

    const [admin] = await tx.delete(TeamInvites).where(eq(TeamInvites.id, inviteId)).returning({ admin: TeamInvites.admin });
    await tx.insert(TeamMembers).values({
      team_id: invite.team_id,
      user_id: authType.userId!,
      admin: admin.admin
    });

    return NextResponse.redirect(new URL("/dashboard", req.url));
  });
}