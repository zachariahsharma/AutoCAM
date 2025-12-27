import { NextRequest } from "next/server";
import { Props } from "../route";
import { getAuthType, parseParamId, validateAuthType } from "@/lib/api-utils";
import { getTeamMembers } from "../../members/route";

export async function GET(req: NextRequest, { params }: Props) {
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await getTeamMembers(id.data);
}