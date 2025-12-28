import { NextRequest } from "next/server";
import { Props } from "../route";
import { createPartCategory, getPartCategories } from "@/app/api/pc/route";
import { parseParamId } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: Props) {
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await getPartCategories(req.nextUrl.searchParams, id.data);
}

export async function POST(req: NextRequest, { params }: Props) {
  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await createPartCategory(await req.json(), id.data);
}