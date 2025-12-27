import { NextRequest } from "next/server";
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
  }, createInsertSchema(Plates));
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

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success)
    return id.response;

  await withAuth(authType, async tx => {
    return routeResponse(200, await tx.query.Plates.findMany({
      where: eq(Plates.category_id, id.data),
      columns: {
        id: true,
        true_depth: true,
        width: true,
        length: true
      }
    }));
  });
}