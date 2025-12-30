import { NextRequest } from "next/server";
import { Props } from "../route";
import { getAuthType, handleDatabaseError, parseJsonBody, parseParamId, routeResponse, validateAuthType } from "@/lib/api-utils";
import { withAuth } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PlateJobs } from "@/lib/schema/cam";
import { createInsertSchema } from "drizzle-zod";
import zod from "zod";

export async function GET(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }

  const id = await parseParamId((await params).id);
  if (!id.success) return id.response;
  return await withAuth(authType, async tx => {
    return await tx.query.PlateJobs.findMany({
      where: eq(PlateJobs.plate_id, id.data),
      columns: {
        id: true,
        status: true,
        cam_download: true,
        screenshot: true
      }
    });
  });
}

export async function POST(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  try { await validateAuthType(authType) }
  catch (err) { return err; }

  const body = await parseJsonBody({
    ...await req.json(),
    plate_id: (await params).id
  }, createInsertSchema(PlateJobs, {
    plate_id: zod.coerce.number().positive()
  }).omit({
    cam_download: true,
    screenshot: true,
  }));
  if (!body.success) return body.response;

  return await withAuth(authType, async tx => {
    try {
      const [id] = await tx.insert(PlateJobs).values(body.data).returning({ id: PlateJobs.id });
      return routeResponse(201, id);
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
