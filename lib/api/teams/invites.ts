import { TeamInvites, Teams } from "@/lib/db/schema/entities";
import { user } from "@/lib/db/schema/auth";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";
import { CommonAuthorization, Conflict, registerTeamEndpoint, ValidationError } from "../common";
import { scopeNames as scopes } from "@/lib/scopes";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { teamIdFromDigest } from "@/lib/auth/server";
import { eq, sql } from "drizzle-orm";
import mailer from "@/lib/mailer";

const CreateSchema = createInsertSchema(TeamInvites).omit({ team_id: true, id: true });
const Invite = createSelectSchema(TeamInvites).omit({ team_id: true, id: true }).openapi("Team Invite");

registerTeamEndpoint([scopes.teams.invites.read], {
  method: "get",
  path: "/api/invites",
  tags: ["Team Invites"],
  summary: "Get Team Invites",
  responses: {
    200: {
      description: "Returns the pending team invites",
      content: {
        "application/json": {
          schema: zod.array(Invite)
        }
      }
    },
    ...CommonAuthorization,
  }
}, {}, { path: "/api/teams/invites" });

registerTeamEndpoint([scopes.teams.invites.send], {
  method: "post",
  path: "/api/invites",
  tags: ["Team Invites"],
  summary: "Send Team Invite",
  responses: {
    204: {
      description: "Team invite sent successfully"
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...Conflict
  }
}, {}, { path: "/api/teams/invites" });

export const GET = routeFactory(async (req, authType, tx, id) => {
  id ??= await teamIdFromDigest(tx, authType);

  return routeResponse(200, await parseJsonBody(await tx.query.TeamInvites.findMany({
    where: eq(TeamInvites.team_id, id)
  }), zod.array(Invite)));
});

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const data = await parseJsonBody(await req.json(), CreateSchema);

  // Check if the user exists
  const existingUser = await tx.query.user.findFirst({
    where: eq(user.email, data.email)
  });

  if (!existingUser) {
    return routeResponse(404, "No user found with this email address");
  }

  const [invite] = await tx
    .insert(TeamInvites)
    .values({ ...data, team_id })
    .returning({ id: TeamInvites.id });
  // Unless there is an egregious race condition this should never return nothing
  const team = (await tx.query.Teams.findFirst({
    where: eq(Teams.id, team_id!)
  }))!;
  await mailer.sendMail({
    from: `"AutoCAM" <${process.env.SMTP_SENDER}>`,
    to: data.email,
    subject: `Join ${team.name}`,
    text: `Join the ${team.name} Team with this link: ${new URL(`/api/user/invites/accept/${invite.id}`, `http://${process.env.BASE_URL}`)}`
  });
  return routeResponse(204);
}, { emailVerifiedNeeded: true });

const DeleteSchema = zod.object({ email: zod.string().email() });

registerTeamEndpoint([scopes.teams.invites.cancel], {
  method: "delete",
  path: "/api/invites",
  tags: ["Team Invites"],
  summary: "Cancel Team Invite",
  responses: {
    204: {
      description: "Team invite cancelled successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
}, {}, { path: "/api/teams/invites" });

export const DELETE = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const { email } = await parseJsonBody(await req.json(), DeleteSchema);

  await tx
    .delete(TeamInvites)
    .where(
      sql`${TeamInvites.team_id} = ${team_id} AND ${TeamInvites.email} = ${email}`
    );

  return routeResponse(204);
});
