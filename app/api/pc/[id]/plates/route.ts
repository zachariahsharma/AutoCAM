import { NextRequest } from "next/server";
import zod from "zod";
import { Props } from "../route";
import { getAuthType, handleDatabaseError, parseJsonBody, parseParamId, routeResponse, validateAuthType } from "@/lib/api-utils";
import { withAuth } from "@/lib/db";
import { Plates } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const data = await parseJsonBody({
    ...await req.json(),
    category_id: (await params).id
  }, createInsertSchema(Plates, {
    width: zod.number().transform(x => x.toString()),
    length: zod.number().transform(x => x.toString()),
    true_depth: zod.number().transform(x => toString())
  }));
  if (!data.success) return data.response;

  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(Plates).values(data.data).returning({ id: Plates.id });
      return routeResponse(201, { id });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

const GetOutput = zod.array(zod.object({
  id: zod.number(),
  width: zod.coerce.number(),
  length: zod.coerce.number(),
  true_depth: zod.coerce.number(),
}));

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success)
    return id.response;

  const result = await parseJsonBody(await withAuth(authType, async tx => {
    return await tx.query.Plates.findMany({
      where: eq(Plates.category_id, id.data),
    });
  }), GetOutput);
  if (!result.success) return result.response;
  return routeResponse(200, result.data);
}