import { getAuthType, handleDatabaseError, parseJsonBody, routeResponse, validateAuthType } from "@/lib/api-utils";
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

export async function GET() {
  return await getInvites();
}

export async function getInvites(teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  return await withAuth(authType, async tx => {
    return await tx.query.TeamInvites.findMany({
      columns: { email: true, id: true },
      where: eq(TeamInvites.team_id, teamId!)
    });
  });
}

const InviteInput = zod.object({
  email: zod.email()
});

export async function inviteEmail(json: object, teamId?: number) {
  const authType = await getAuthType();
  try {
    await validateAuthType(authType, true);
    if (authType.keyDigest)
      teamId = await teamIdFromDigest(authType.keyDigest);
  } catch (err) { return err; }

  const data = await parseJsonBody(json, InviteInput);
  if (!data.success)
    return data.response;

  try {
    const [id, teamName] = await withAuth(authType, async tx => {
      const [invite] = await tx
        .insert(TeamInvites)
        .values({ team_id: teamId!, ...data.data })
        .returning({ id: TeamInvites.id });
      // Unless there is an egregious race condition this should never return nothing
      const team = (await tx.query.Teams.findFirst({
        where: eq(Teams.id, teamId!)
      }))!;
      return [invite.id, team.name];
    });
    await mailer.sendMail({
      from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
      to: data.data.email,
      subject: `Join ${teamName}`,
      text: `Join the ${teamName} Team with this link: ${new URL(`/api/user/invites/accept/${id}`, `http://${process.env.BASE_URL}`)}`
    });
    return routeResponse();
  } catch (err) {
    return handleDatabaseError(err);
  }
}