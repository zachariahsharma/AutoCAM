import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { DatabaseError } from "pg";
import { updateTeam } from "../route";
import zod, { ZodError } from "zod";

export interface Props { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    return await updateTeam(await req.json(), await zod.coerce.number().positive().parseAsync((await params).id))
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json(err.issues, { status: 422 });
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const teamId = await zod.coerce.number().positive().safeParseAsync((await params).id);
  if (!teamId.success)
    return NextResponse.json(teamId.error.issues, { status: 422 });
  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const deleted = await tx.delete(Teams).where(eq(Teams.id, teamId.data)).returning({ id: Teams.id });
      if (deleted.length === 0)
        return new NextResponse(null, { status: 404 });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}