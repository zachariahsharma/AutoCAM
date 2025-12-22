import { getAuthType, handleDatabaseError, parseJsonBody, requireEmailVerified, routeResponse } from "@/lib/api-utils";
import { teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";

export async function POST(req: NextRequest) {
  return await inviteEmail(await req.json());
}

const InviteInput = zod.object({
  email: zod.email()
});

export async function inviteEmail(json: object, team_id?: number) {
  const authType = await getAuthType();
  if (authType.userId) {
    const err = await requireEmailVerified();
    if (err) return err;
  } else if (authType.keyDigest) {
    team_id = await teamIdFromDigest(authType.keyDigest);
  } else return routeResponse(401);
  if (!team_id) return routeResponse(401);

  const data = await parseJsonBody(json, InviteInput);
  if (!data.success)
    return data.response;

  try {
    const [id, teamName] = await withAuth(authType, async tx => {
      const [invite] = await tx
        .insert(TeamInvites)
        .values({ team_id, ...data.data })
        .returning({ id: TeamInvites.id });
      // Unless there is an egregious race condition this should never return nothing
      const team = (await tx.query.Teams.findFirst({
        where: eq(Teams.id, team_id!)
      }))!;
      return [invite.id, team.name];
    });
    await mailer.sendMail({
      from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
      to: data.data.email,
      subject: `Join ${teamName}`,
      text: `Join the ${teamName} Team with this link: ${new URL(`/api/teams/accept/${id}`, `http://${process.env.BASE_URL}`)}`
    });
    return routeResponse(200);
  } catch (err) {
    return handleDatabaseError(err);
  }
}