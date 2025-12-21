import { updatePartCategory } from "@/app/api/pc/[id]/route";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, pc: string }> }) {
  return await updatePartCategory(await req.formData(), Number((await params).pc), Number((await params).id));
}