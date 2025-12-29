import { TeamMembers, Teams } from "@/lib/schema/entities";
import {
  parseJsonBody,
  routeResponse,
  routeFactory
} from "@/lib/api-utils";
import { createInsertSchema } from "drizzle-zod";

export const POST = routeFactory(async (req, authType, tx) => {
  const body = await parseJsonBody({
    ...await req.json(),
    owner: authType.userId
  }, createInsertSchema(Teams));
  const [id] = await tx.insert(Teams).values(body).returning({ id: Teams.id });
  await tx.insert(TeamMembers).values({
    user_id: authType.userId!,
    team_id: id.id,
    admin: true,
  });
  return routeResponse(201, id);
});

export const GET = routeFactory(async (req, authType, tx) => {
  if (authType.userId)
    return routeResponse(200, await tx.query.Teams.findMany());
  const team = await tx.query.Teams.findFirst();
  if (!team) return routeResponse(403);
  return routeResponse(200, team);
});
