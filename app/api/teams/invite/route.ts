import { getAuthType, getUserId } from "@/lib/api-utils";
import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites, TeamKeys, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
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
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (authType.keyDigest) {
    team_id = await teamIdFromDigest(authType.keyDigest);
  } else return new NextResponse(null, { status: 401 });
  if (!team_id) return new NextResponse(null, { status: 401 });

  const data = await InviteInput.safeParseAsync(json);
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });

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
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    if (err instanceof DatabaseError && err.code === "42501")
      return new NextResponse(null, { status: 403 });
    throw err;
  }
}