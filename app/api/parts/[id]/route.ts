import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod from "zod";

interface Props {
  params: Promise<{ id: string }>
};

const UpdateInput = zod.object({
  epic: zod.string(),
  name: zod.string(),
  quantity: zod.number(),
  ticket: zod.string(),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const authType: AuthType = {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
  
  if (authType.userId) {
    if (!await isEmailVerified()) return EmailNotVerifiedResponse;
  } else if (!authType.keyDigest)
    return new NextResponse(null, { status: 401 });
  
  const partId = await zod.number().safeParseAsync((await params).id);
  if (!partId.success)
    return NextResponse.json(partId.error.issues, { status: 422 });
  const data = await UpdateInput.safeParseAsync(await req.json());
  if (!data.success)
    return NextResponse.json(data.error.issues, { status: 422 });

  return await withAuth(authType, async tx => {
    try {
      //
    } catch (err) {
      if (err instanceof DatabaseError && err.code === "42501")
        return new NextResponse(null, { status: 403 });
      throw err;
    }
  });
}