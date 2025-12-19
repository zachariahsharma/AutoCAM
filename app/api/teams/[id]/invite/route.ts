import { EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import db from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites } from "@/lib/schema/entities";
import { getTeamMember, TeamMemberNotAdmin } from "../../route";

export async function POST(req: NextRequest, { params }: Props) {
  const team_id = Number((await params).id);
  if (!isEmailVerified(req)) return EmailNotVerifiedResponse;
  const teamMember = await getTeamMember(req, team_id);
  if (!teamMember || !teamMember.admin) return TeamMemberNotAdmin;

  const email = (await req.formData()).get("email")?.toString();
  if (!email) return new NextResponse(null, { status: 400 });
  const [invite] = await db.insert(TeamInvites).values({ team_id, email }).returning({ id: TeamInvites.id });

  await mailer.sendMail({
    from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
    to: email,
    subject: `Join ${teamMember.team.name}`,
    text: `Join the ${teamMember.team.name} Team with this link: http://${process.env.BASE_URL}/api/teams/accept/${invite.id}`
  });

  return new NextResponse(null, { status: 200 });
}