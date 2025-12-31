import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { AuthType, teamIdFromDigest } from "@/lib/auth/server";
import { Transaction } from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites, Teams } from "@/lib/db/schema/entities";
import { eq } from "drizzle-orm";
import { Invite, InvitesCreateSchema } from "@/lib/api/teams/invites";
import zod from "zod";

export const POST = routeFactory(async (req, authType, tx) => inviteEmail(authType, tx, await req.json()));
export const GET = routeFactory((req, authType, tx) => getInvites(authType, tx));

export async function getInvites(authType: AuthType, tx: Transaction, teamId?: number) {
  teamId ??= await teamIdFromDigest(tx, authType);

  return routeResponse(200, await parseJsonBody(await tx.query.TeamInvites.findMany({
    where: eq(TeamInvites.team_id, teamId!)
  }), zod.array(Invite)));
}

export async function inviteEmail(authType: AuthType, tx: Transaction, json: object, team_id?: number) {
  team_id ??= await teamIdFromDigest(tx, authType);

  const data = await parseJsonBody(json, InvitesCreateSchema);

  const [invite] = await tx
    .insert(TeamInvites)
    .values({ ...data, team_id })
    .returning({ id: TeamInvites.id });
  // Unless there is an egregious race condition this should never return nothing
  const team = (await tx.query.Teams.findFirst({
    where: eq(Teams.id, team_id!)
  }))!;
  await mailer.sendMail({
    from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
    to: data.email,
    subject: `Join ${team.name}`,
    text: `Join the ${team.name} Team with this link: ${new URL(`/api/user/invites/accept/${invite.id}`, `http://${process.env.BASE_URL}`)}`
  });
  return routeResponse(204);
}