import { TeamMembers, Teams } from "@/lib/db/schema/entities";
import {
  parseJsonBody,
  routeResponse,
  routeFactory
} from "@/lib/api";
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
}, { emailVerifiedNeeded: true });

export const GET = routeFactory(async (req, authType, tx) => {
  if (authType.userId)
    return routeResponse(200, await tx.query.Teams.findMany());
  const team = await tx.query.Teams.findFirst();
  if (!team) return routeResponse(403);
  return routeResponse(200, team);
});
