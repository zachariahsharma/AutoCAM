import { auth } from "@/lib/auth";
import db, { withUser } from "@/lib/db";
import { Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { DatabaseError } from "pg";

export interface Props { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const teamId = Number((await params).id);
  const formData = await req.formData();

  const teamNumber = formData.get("number")?.toString();
  return await withUser(session.user.id, async tx => {
    try {
      tx.update(Teams).set({
        name: formData.get("name")?.toString(),
        number: teamNumber ? Number(teamNumber) : undefined
      }).where(eq(Teams.id, teamId));
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const teamId = Number((await params).id);
  await withUser(session.user.id, async tx => {
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