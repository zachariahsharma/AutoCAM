import { NextRequest } from "next/server";
import { Props } from "../route";
import { withAuth } from "@/lib/db";
import { Parts, PartsInsertSchema } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { getAuthType, handleDatabaseError, parseJsonBody, parseParamId, routeResponse, validateAuthType } from "@/lib/api-utils";
import zod from "zod";

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const formData = await req.formData();
  const json = formData.get("data");
  const file = formData.get("file");
  if (typeof json !== "string" || !(file instanceof File)) return routeResponse(422);

  const data = await parseJsonBody({
    ...JSON.parse(json),
    file: await file.arrayBuffer(),
    category_id: (await params).id
  }, PartsInsertSchema.extend({ category_id: zod.coerce.number().positive() }));
  if (!data.success) return data.response;
  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(Parts)
        .values(data.data)
        .returning({ id: Parts.id });
      return routeResponse(201, id);
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success)
    return id.response;
  return routeResponse(200, await withAuth(authType, async tx => {
    return await tx.query.Parts.findMany({
      where: eq(Parts.category_id, id.data),
      columns: {
        epic: true,
        name: true,
        quantity: true,
        id: true,
        ticket: true,
      }
    });
  }));
}