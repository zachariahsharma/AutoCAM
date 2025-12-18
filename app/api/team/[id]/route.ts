import db from "@/lib/db";
import { Teams } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface Props { params: { id: number } };

export async function GET(req: NextRequest, { params }: Props) {
  const team = await db.query.Teams.findFirst({
    where: (table, { eq }) => eq(table.id, params.id),
  });
  if (!team) return new NextResponse(null, { status: 404 });
  return NextResponse.json(team);
}

export async function PUT(req: NextRequest, { params }: Props) {
  const formData = await req.formData();

  const name = formData.get("name")?.toString();
  if (!name) return new NextResponse(null, { status: 422 });

  await db.update(Teams).set({ name: name }).where(eq(Teams.id, params.id));
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  await db.delete(Teams).where(eq(Teams.id, Number(params.id)));
  return new NextResponse(null, { status: 204 });
}