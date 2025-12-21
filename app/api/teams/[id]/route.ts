import { auth, EmailNotVerifiedResponse, isEmailVerified } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { DatabaseError } from "pg";
import { updateTeam } from "../route";

export interface Props { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  return await updateTeam(await req.formData(), Number((await params).id));
}

export async function DELETE(req: NextRequest, { params }: Props) {
  if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const teamId = Number((await params).id);
  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      await tx.delete(Teams).where(eq(Teams.id, teamId));
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}