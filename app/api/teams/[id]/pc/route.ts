import { NextRequest } from "next/server";
import { Props } from "../route";
import { createPartCategory, getPartCategories } from "@/app/api/pc/route";

export async function GET(req: NextRequest, { params }: Props) {
  return await getPartCategories(Number((await params).id));
}

export async function POST(req: NextRequest, { params }: Props) {
  return await createPartCategory(await req.formData(), Number((await params).id));
}