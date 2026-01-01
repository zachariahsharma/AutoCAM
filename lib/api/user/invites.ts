import { createSelectSchema } from "drizzle-zod";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { TeamInvites, TeamMembers } from "@/lib/db/schema/entities";
import zod from "zod";

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import db from "@/lib/db";
import { headers } from "next/headers";

const Invite = createSelectSchema(TeamInvites).omit({ id: true }).extend({ team: zod.string() });

export const GET = routeFactory(async (req, authType, tx) => {
  return routeResponse(200, await parseJsonBody((await tx.query.TeamInvites.findMany({
    with: { team: true },
  })).map(x => ({ ...x, team: x.team.name })), zod.array(Invite)))
});

export const Accept = {
  GET: async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const inviteId = (await params).id;
  const invite = await db.query.TeamInvites.findFirst({
    where: eq(TeamInvites.id, inviteId)
  });
  if (!invite) return routeResponse(404);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return routeResponse(401, { message: "User session not found" });
  if (session.user.email !== invite.email) return routeResponse(403, { message: "User email does not match invite email" });

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
};