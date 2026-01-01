import { createSelectSchema } from "drizzle-zod";
import { parseJsonBody, routeFactory, routeResponse } from "../..";
import { TeamInvites } from "@/lib/db/schema/entities";
import zod from "zod";

import "./accept";

const Invite = createSelectSchema(TeamInvites).omit({ id: true }).extend({ team: zod.string() });

export const GET = routeFactory(async (req, authType, tx) => {
  return routeResponse(200, await parseJsonBody((await tx.query.TeamInvites.findMany({
    with: { team: true },
  })).map(x => ({ ...x, team: x.team.name })), zod.array(Invite)))
});