import { NextRequest, NextResponse } from "next/server";
import { Props } from "../route";
import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified } from "@/lib/auth";
import { headers } from "next/headers";
import { withAuth } from "@/lib/db";
import { Parts } from "@/lib/schema/cam";
import { DatabaseError } from "pg";
import zod from "zod";

const CreateInput = zod.object({
  name: zod.string(),
  epic: zod.string(),
  ticket: zod.string(),
  quantity: zod.number(),
});

export async function POST(req: NextRequest, { params }: Props) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  if (authType.userId) {
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (authType.keyDigest) { }
  else return new NextResponse(null, { status: 401 });

  const category_id = Number((await params).id);
  const data = await CreateInput.safeParseAsync(await req.json());
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });
  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(Parts).values({ ...data.data, category_id }).returning({ id: Parts.id });
      return NextResponse.json({ id: id.id }, { status: 201 });
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}