import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import db, { withUser } from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites, Teams } from "@/lib/schema/entities";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { DatabaseError } from "pg";

export async function POST(req: NextRequest, { params }: Props) {
  const team_id = Number((await params).id);
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;

  const email = (await req.formData()).get("email")?.toString();
  if (!email) return new NextResponse(null, { status: 400 });

  try {
    const [id, teamName] = await withUser(session.user.id, async tx => {
      const [invite] = await tx
        .insert(TeamInvites)
        .values({ team_id, email })
        .returning({ id: TeamInvites.id });
      // Unless there is an egregious race condition this should never return nothing
      const team = (await tx.query.Teams.findFirst({
        where: eq(Teams.id, team_id)
      }))!;
      return [invite.id, team.name];
    });
    await mailer.sendMail({
      from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
      to: email,
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