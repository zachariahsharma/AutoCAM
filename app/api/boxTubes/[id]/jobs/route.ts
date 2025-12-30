import { NextRequest } from "next/server";
import { Props } from "../route";
import { getAuthType, handleDatabaseError, parseJsonBody, parseParamId, routeResponse, validateAuthType } from "@/lib/api-utils";
import { withAuth } from "@/lib/db";
import { eq } from "drizzle-orm";
import { BoxTubeJobs } from "@/lib/schema/cam";
import { createInsertSchema } from "drizzle-zod";

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;

  return routeResponse(200, await withAuth(authType, async tx => {
    return await tx.query.BoxTubeJobs.findMany({
      where: eq(BoxTubeJobs.box_tube_id, id.data)
    });
  }));
}

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType, true); }
  catch (err) { return err; }

  const body = await parseJsonBody({
    ...await req.json(),
    box_tube_id: (await params).id
  }, createInsertSchema(BoxTubeJobs));
  if (!body.success) return body.response;

  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(BoxTubeJobs).values(body.data).returning({ id: BoxTubeJobs.id });
      return routeResponse(201, id);
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}