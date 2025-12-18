import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import db from "@/lib/db";

export async function POST(req: NextRequest, { params }: Props) {
    const teamId = Number((await params).id);
    const session = (await auth.api.getSession({ headers: req.headers }))!;
    if (!session.user.emailVerified) return new NextResponse(null, { status: 403 });

    const teamMember = await db.query.TeamMembers.findFirst({
        where: (table, {eq}) => eq(table.team_id, teamId) && eq(table.user_id, session.user.id)
    });
    if (!teamMember || !teamMember.admin) return new NextResponse(null, { status: 403 });

    const collaborator = (await req.formData()).get("collaborator")?.toString();
    if (!collaborator) return new NextResponse(null, { status: 400 });
}