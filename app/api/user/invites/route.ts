import { getAuthType, routeResponse, validateAuthType } from "@/lib/api-utils";
import db, { withAuth } from "@/lib/db";

export async function GET() {
  const authType = await getAuthType();
  try { await validateAuthType(authType); }
  catch (err) { return err; }

  return routeResponse(200, (await withAuth(authType, async tx => {
    return await tx.query.TeamInvites.findMany({
      with: { team: true },
      columns: { id: true }
    });
  })).map(x => ({ id: x.id, teamName: x.team.name })));
}