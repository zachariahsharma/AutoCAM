import { NextRequest } from "next/server";
import { Props } from "../route";
import { getPartCategories } from "@/app/api/pc/route";

export async function GET(req: NextRequest, { params }: Props) {
  return await getPartCategories(Number((await params).id));
}