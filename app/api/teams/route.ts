import { TeamMembers, Teams } from "@/lib/db/schema/entities";
import {
  parseJsonBody,
  routeResponse,
  routeFactory
} from "@/lib/api";
import { TeamsCreateSchema, TeamsGetSchema } from "@/lib/api/teams";
import { registry } from "@/lib/openapi/registry";

export const POST = routeFactory(async (req, authType, tx) => {
  const body = await parseJsonBody(await req.json(), TeamsCreateSchema);
  const [id] = await tx.insert(Teams).values({
    ...body,
    owner: authType.userId!
  }).returning({ id: Teams.id });
  await tx.insert(TeamMembers).values({
    user_id: authType.userId!,
    team_id: id.id,
    admin: true,
  });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const GET = routeFactory(async (req, authType, tx) => {
  if (authType.userId)
    return routeResponse(200, await tx.query.Teams.findMany());
  const team = await tx.query.Teams.findFirst();
  if (!team) return routeResponse(403);
  return routeResponse(200, team);
});
