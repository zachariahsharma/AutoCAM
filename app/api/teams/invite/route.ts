import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api-utils";
import { AuthType, teamIdFromDigest } from "@/lib/auth";
import { Transaction } from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const POST = routeFactory(async (req, authType, tx) => inviteEmail(authType, tx, await req.json()));
export const GET = routeFactory((req, authType, tx) => getInvites(authType, tx));

export async function getInvites(authType: AuthType, tx: Transaction, teamId?: number) {
  if (authType.keyDigest)
    teamId = await teamIdFromDigest(tx, authType.keyDigest);

  return routeResponse(200, await tx.query.TeamInvites.findMany({
    columns: { email: true, id: true },
    where: eq(TeamInvites.team_id, teamId!)
  }));
}

export async function inviteEmail(authType: AuthType, tx: Transaction, json: object, team_id?: number) {
  if (authType.keyDigest)
    team_id = await teamIdFromDigest(tx, authType.keyDigest);

  const data = await parseJsonBody({ ...json, team_id }, createInsertSchema(TeamInvites));

  const [invite] = await tx
    .insert(TeamInvites)
    .values(data)
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
  return routeResponse();
}