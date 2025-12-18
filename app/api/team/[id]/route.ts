import db from "@/lib/db";
import { Teams } from "@/lib/schema";
import { eq, getTableColumns } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export interface Props { params: Promise<{ id: number }> };

export async function GET(req: NextRequest, { params }: Props) {
  const teamId = (await params).id;
  const team = await db.query.Teams.findFirst({
    where: (table, { eq }) => eq(table.id, teamId),
  });
  if (!team) return new NextResponse(null, { status: 404 });
  return NextResponse.json(team);
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const formData = await req.formData();

  const teamId = (await params).id;
  const teamNumber = formData.get("number")?.toString();
  await db.update(Teams).set({
    name: formData.get("name")?.toString(),
    number: teamNumber ? Number(teamNumber) : undefined,
  }).where(eq(Teams.id, teamId));
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const teamId = (await params).id;
  await db.delete(Teams).where(eq(Teams.id, teamId));
  return new NextResponse(null, { status: 204 });
}