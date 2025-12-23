import { NextRequest } from "next/server";
import zod from "zod";
import { Props } from "../route";
import { getAuthType, handleDatabaseError, parseJsonBody, parseParamId, routeResponse, validateAuthType } from "@/lib/api-utils";
import { withAuth } from "@/lib/db";
import { Plates } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";

const CreateInput = zod.object({
  width: zod.number().transform(x => x.toString()),
  length: zod.number().transform(x => x.toString()),
  trueDepth: zod.number().transform(x => x.toString())
});

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const categoryId = await parseParamId((await params).id);
  if (!categoryId.success) return categoryId.response;

  const data = await parseJsonBody(await req.json(), CreateInput);
  if (!data.success) return data.response;

  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(Plates)
        .values({
          ...data.data,
          true_depth: data.data.trueDepth,
          category_id: categoryId.data
        }).returning({ id: Plates.id });
      return routeResponse(201, { id: id.id });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const categoryId = await parseParamId((await params).id);
  if (!categoryId.success)
    return categoryId.response;

  return routeResponse(200, await withAuth(authType, async tx => {
    return await tx.query.Plates.findMany({
      where: eq(Plates.category_id, categoryId.data)
    });
  }));
}