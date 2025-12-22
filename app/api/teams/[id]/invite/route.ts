import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { inviteEmail } from "../../invite/route";
import zod, { ZodError } from "zod";
import { getUserId } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: Props) {
  if (!await getUserId())
    return new NextResponse(null, { status: 401 });
  try {
    return await inviteEmail(await req.json(), await zod.coerce.number().positive().parseAsync((await params).id));
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json(err.issues, { status: 422 });
    throw err;
  }
}