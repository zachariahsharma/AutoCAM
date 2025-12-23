import { NextRequest } from "next/server";
import { Props } from "../route";
import { withAuth } from "@/lib/db";
import { Parts } from "@/lib/schema/cam";
import zod from "zod";
import { eq } from "drizzle-orm";
import { getAuthType, handleDatabaseError, parseJsonBody, parseParamId, routeResponse, validateAuthType } from "@/lib/api-utils";

const CreateInput = zod.object({
  name: zod.string(),
  epic: zod.string(),
  ticket: zod.string(),
  quantity: zod.number(),
});

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { validateAuthType(authType, true); }
  catch (err) { return err; }

  const categoryId = await parseParamId((await params).id);
  if (!categoryId.success) return categoryId.response;
  const data = await parseJsonBody(await req.json(), CreateInput);
  if (!data.success) return data.response;
  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(Parts)
        .values({ ...data.data, category_id: categoryId.data })
        .returning({ id: Parts.id });
      return routeResponse(201, { id: id.id });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { validateAuthType(authType, true); }
  catch (err) { return err; }

  const categoryId = await parseParamId((await params).id);
  if (!categoryId.success)
    return categoryId.response;
  return routeResponse(200, await withAuth(authType, async tx => {
    return await tx.query.Parts.findMany({
      where: eq(Parts.category_id, categoryId.data),
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