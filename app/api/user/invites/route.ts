import { routeFactory, routeResponse } from "@/lib/api-utils";

export const GET = routeFactory(async (req, authType, tx) => {
  return routeResponse(200, (await tx.query.TeamInvites.findMany({
    with: { team: true },
    columns: { id: true }
  })).map(x => ({ ...x, team: x.team.name })))
});