import { NextRequest } from "next/server";
import { Props } from "../route";
import { inviteEmail } from "../../invite/route";

export async function POST(req: NextRequest, { params }: Props) {
  return await inviteEmail(await req.formData(), Number((await params).id));
}