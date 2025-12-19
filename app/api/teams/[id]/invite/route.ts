import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import db from "@/lib/db";
import mailer from "@/lib/mailer";
import { TeamInvites } from "@/lib/schema/entities";
import { and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: Props) {
    const teamId = Number((await params).id);
    const session = (await auth.api.getSession({ headers: req.headers }))!;
    if (!session.user.emailVerified) return new NextResponse(null, { status: 403 });

    const teamMember = await db.query.TeamMembers.findFirst({
        with: { team: true },
        where: (table, {eq}) => and(eq(table.team_id, teamId), eq(table.user_id, session.user.id))
    });
    if (!teamMember || !teamMember.admin) return new NextResponse(null, { status: 403 });
    
    const email = (await req.formData()).get("email")?.toString();
    if (!email) return new NextResponse(null, { status: 400 });
    const [invite] = await db.insert(TeamInvites).values({
        team_id: teamId,
        email: email
    }).returning({ id: TeamInvites.id });

    await mailer.sendMail({
        from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
        to: email,
        subject: `Join ${teamMember.team.name}`,
        text: `Join the ${teamMember.team.name} Team with this link: http://${process.env.BASE_URL}/api/teams/accept/${invite.id}`
    });

    return new NextResponse(null, { status: 200 });
}