import { NextRequest } from "next/server";
import { Props } from "../route";
import { getAuthType, parseParamId, validateAuthType } from "@/lib/api-utils";
import { withAuth } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PlateJobs } from "@/lib/schema/cam";

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
