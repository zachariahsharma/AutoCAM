import { TeamInvites, Teams } from "@/lib/db/schema/entities";
import { registry } from "@/lib/openapi/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";
import { CommonAuthorization, ValidationError } from "../codes";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { teamIdFromDigest } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import mailer from "@/lib/mailer";

const CreateSchema = createInsertSchema(TeamInvites).omit({ team_id: true, id: true });
const Invite = createSelectSchema(TeamInvites).omit({ team_id: true, id: true }).meta({ id: "Team Invite" });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/invites",
  tags: ["Team Invites"],
  summary: "Get Team Invites (User)",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
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
    ...ValidationError
  }
});

registry.registerPath({
  method: "get",
  path: "/api/teams/invites",
  tags: ["Team Invites"],
  summary: "Get Team Invites (API Key)",
  security: [{ [apiKey.name]: [scopes.teams.invites.read] }],
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
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/invites",
  tags: ["Team Invites"],
  summary: "Send Team Invite (User)",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    204: {
      description: "Team invite sent successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/invites",
  tags: ["Team Invites"],
  summary: "Send Team Invite (API Key)",
  security: [{ [apiKey.name]: [scopes.teams.invites.send] }],
  responses: {
    204: {
      description: "Team invite sent successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  id ??= await teamIdFromDigest(tx, authType);

  return routeResponse(200, await parseJsonBody(await tx.query.TeamInvites.findMany({
    where: eq(TeamInvites.team_id, id)
  }), zod.array(Invite)));
});

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const data = await parseJsonBody(await req.json(), CreateSchema);

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
