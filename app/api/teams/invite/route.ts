import { getAuthType, handleDatabaseError, parseJsonBody, routeFactory, routeResponse, validateAuthType } from "@/lib/api-utils";
import { AuthType, teamIdFromDigest } from "@/lib/auth";
import { Transaction, withAuth } from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { createInsertSchema } from "drizzle-zod";

export const POST = routeFactory(async (req, authType, tx) => inviteEmail(authType, tx, await req.json()));
export const GET = routeFactory((req, authType, tx) => getInvites(authType, tx));

export async function getInvites(authType: AuthType, tx: Transaction, teamId?: number) {
  if (authType.keyDigest)
    teamId = await teamIdFromDigest(authType.keyDigest);

  return routeResponse(200, await tx.query.TeamInvites.findMany({
    columns: { email: true, id: true },
    where: eq(TeamInvites.team_id, teamId!)
  }));
}

export async function inviteEmail(authType: AuthType, tx: Transaction, json: object, teamId?: number) {
  if (authType.keyDigest)
    teamId = await teamIdFromDigest(authType.keyDigest);

  const data = await parseJsonBody({
    ...json,
    team_id: teamId
  }, createInsertSchema(TeamInvites));

  const [id, teamName] = await withAuth(authType, async tx => {
    const [invite] = await tx
      .insert(TeamInvites)
      .values(data)
      .returning({ id: TeamInvites.id });
    // Unless there is an egregious race condition this should never return nothing
    const team = (await tx.query.Teams.findFirst({
      where: eq(Teams.id, teamId!)
    }))!;
    return [invite.id, team.name];
  });
  await mailer.sendMail({
    from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
    to: data.email,
    subject: `Join ${teamName}`,
    text: `Join the ${teamName} Team with this link: ${new URL(`/api/user/invites/accept/${id}`, `http://${process.env.BASE_URL}`)}`
  });
  return routeResponse();
}