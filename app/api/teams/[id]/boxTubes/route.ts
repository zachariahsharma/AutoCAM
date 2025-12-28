import { NextRequest } from "next/server";
import { Props } from "../route";
import { parseParamId } from "@/lib/api-utils";
import { createBoxTube, getBoxTubes } from "@/app/api/boxTubes/route";

export async function GET(req: NextRequest, { params }: Props) {
  const teamId = await parseParamId((await params).id);
  if (!teamId.success) return teamId.response;
  return await getBoxTubes(teamId.data);
}

export async function POST(req: NextRequest, { params }: Props) {
  const teamId = await parseParamId((await params).id);
  if (!teamId.success) return teamId.response;
  return await createBoxTube(await req.formData(), teamId.data);
}